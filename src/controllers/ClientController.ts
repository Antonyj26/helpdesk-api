import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";
import { compare, hash } from "bcrypt";
import { techController } from "./TechController";

class ClientController {
  async createClient(request: Request, response: Response) {
    const bodySchema = z.object({
      name: z.string().trim().min(2, { message: "Nome é obrigatório" }),
      email: z
        .string()
        .trim()
        .email({ message: "Email inválido" })
        .toLowerCase(),
      password: z
        .string()
        .min(6, { message: "A senha dever ter pelo menos 6 dígitos" }),
    });

    const { name, email, password } = bodySchema.parse(request.body);

    const userWithSameEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (userWithSameEmail) {
      return new AppError("Já existe um usuário cadastrado com esse e-mail");
    }

    const hashedPassword = await hash(password, 8);

    const user = await prisma.user.create({
      data: {
        role: "client",
        name,
        email,
        password: hashedPassword,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    return response.status(201).json(userWithoutPassword);
  }

  async updateClient(request: Request, response: Response) {
    const { id: client_id } = request.user;

    const client = await prisma.user.findUnique({ where: { id: client_id } });

    if (!client) {
      throw new AppError("client not found", 404);
    }

    const bodySchema = z
      .object({
        name: z
          .string()
          .trim()
          .min(3, { message: "Nome deve ter pelo menos 3 caracteres" })
          .optional(),
        currentPassword: z.string().min(6).optional(),
        newPassword: z
          .string()
          .min(6, { message: "Senha deve conter pelo menos 6 caracteres" })
          .optional(),
      })
      .refine((data) => !(data.newPassword && !data.currentPassword), {
        message: "Você deve informar a senha atual",
        path: ["currentPassword"],
      });

    const { name, currentPassword, newPassword } = bodySchema.parse(
      request.body
    );

    if (currentPassword && newPassword) {
      const passwordMatch = await compare(currentPassword, client.password);
      if (!passwordMatch) {
        throw new AppError("Senha atual incorreta", 401);
      }
    }

    const dataToUptdated: { name?: string; password?: string } = {};

    if (name) dataToUptdated.name;
    if (newPassword) dataToUptdated.password = await hash(newPassword, 8);

    if (Object.keys(dataToUptdated).length === 0) {
      throw new AppError("Nenhum dado para atualizar", 400);
    }

    const updatedClient = await prisma.user.update({
      where: { id: client_id },
      data: dataToUptdated,
      select: {
        name: true,
        email: true,
        role: true,
      },
    });

    return response.json({ updatedClient, message: "Atualizado com sucesso" });
  }

  async showClient(request: Request, response: Response) {
    const client = await prisma.user.findUnique({
      where: { id: request.user.id },
    });

    response.json(client);
  }

  async createTicket(request: Request, response: Response) {
    const bodySchema = z.object({
      title: z
        .string()
        .trim()
        .min(6, { message: "Título deve conter pelo menos 6 caracteres" }),
      description: z
        .string()
        .trim()
        .min(8, { message: "Descrição deve conter pelo menos 8 caracteres" }),
      tech_id: z.string().uuid(),
      selectedHour: z.string().regex(/^([0-1]\d|2[0-3]):([0-5]\d)$/, {
        message: "Horário deve estar no formato HH:MM",
      }),
      service_id: z.string().uuid(),
    });

    const { title, description, tech_id, selectedHour, service_id } =
      bodySchema.parse(request.body);

    const { id: client_id } = request.user;

    const tech = await prisma.user.findUnique({
      where: { id: tech_id },
    });

    if (!tech || !tech.active) {
      throw new AppError("Tech not found", 404);
    }

    const service = await prisma.service.findUnique({
      where: { id: service_id },
    });

    if (!service || !service.active) {
      throw new AppError("Service not found", 404);
    }

    const availability = await prisma.techAvailability.findUnique({
      where: { techId: tech_id },
    });

    if (!availability || !availability.availableHours.includes(selectedHour)) {
      throw new AppError("Horário indisponível para esse técnico", 400);
    }

    const conflict = await prisma.ticket.findFirst({
      where: {
        techId: tech_id,
        selectedHour,
        status: "open",
      },
    });

    if (conflict) {
      throw new AppError(
        "Esse horário já está ocupado para o técnico selecionado",
        400
      );
    }

    const newTicket = await prisma.ticket.create({
      data: {
        title,
        description,
        techId: tech_id,
        clientId: client_id,
        selectedHour,
      },
      include: {
        services: { include: { service: true } },
      },
    });

    await prisma.ticketServices.create({
      data: {
        ticketId: newTicket.id,
        serviceId: service_id,
      },
    });

    return response
      .status(201)
      .json({ message: "Ticket criado com sucesso", newTicket });
  }

  async indexTicketClient(request: Request, response: Response) {
    const tickets = await prisma.ticket.findMany({
      where: { clientId: request.user.id },

      include: {
        services: {
          include: { service: { select: { price: true, name: true } } },
        },
        client: { select: { name: true } },
        tech: { select: { name: true } },
      },
    });

    const ticketsFormated = tickets.map((ticket) => ({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      selectedHour: ticket.selectedHour,
      updatedAt: ticket.updatedAt,
      services: ticket.services.map((s) => s.service.name),
      price: ticket.services.map((p) => p.service.price),
      client: ticket.client.name,
      tech: ticket.tech.name,
    }));

    return response.json({
      message:
        ticketsFormated.length === 0
          ? "Você não tem tickets"
          : "Esses são seus tickets",
      ticketsFormated,
    });
  }

  async deleteClient(request: Request, response: Response) {
    const client_id = request.user.id;

    const client = await prisma.user.findUnique({ where: { id: client_id } });

    if (!client) {
      throw new AppError("Cliente não encontrado", 404);
    }

    const tickets = await prisma.ticket.findMany({
      where: { clientId: client_id },
      select: { id: true },
    });

    const ticketsId = tickets.map((t) => t.id);

    if (ticketsId.length > 0) {
      await prisma.ticketServices.deleteMany({
        where: { ticketId: { in: ticketsId } },
      });

      await prisma.ticket.deleteMany({ where: { id: { in: ticketsId } } });
    }

    await prisma.user.delete({ where: { id: client_id } });

    return response.json({ message: "Cliente excluído com sucesso" });
  }
}

export { ClientController };
