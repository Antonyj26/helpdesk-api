import { Request, Response } from "express";
import { includes, z } from "zod";
import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";
import { compare, hash } from "bcrypt";
import { TicketStatus } from "@prisma/client";

class techController {
  async update(request: Request, response: Response) {
    const { id: tech_id } = request.user;

    const tech = await prisma.user.findUnique({ where: { id: tech_id } });

    if (!tech) {
      throw new AppError("Tech not found", 404);
    }

    const bodySchema = z
      .object({
        name: z
          .string()
          .trim()
          .min(3, { message: "Nome deve ter mais caracteres" })
          .optional(),
        currentPassword: z.string().min(6).optional(),
        newPassword: z
          .string()
          .min(6, { message: "A senha deve conter pelo menos 6 caracteres" })
          .optional(),
      })
      .refine((data) => !(data.newPassword && !data.currentPassword), {
        message:
          "Você precisa informar a senha atual para definir uma nova senha",
        path: ["currentPassword"],
      });

    const { name, currentPassword, newPassword } = bodySchema.parse(
      request.body
    );

    if (newPassword && currentPassword) {
      const passwordMatch = await compare(currentPassword, tech.password);
      if (!passwordMatch) {
        throw new AppError("Senha atual incorreta", 401);
      }
    }

    const dataToUptdated: { name?: string; password?: string } = {};

    if (name) dataToUptdated.name = name;
    if (newPassword) dataToUptdated.password = await hash(newPassword, 8);

    if (Object.keys(dataToUptdated).length === 0) {
      throw new AppError("Nenhum dado para atualizar", 400);
    }

    const updatedTech = await prisma.user.update({
      where: { id: tech_id },
      data: dataToUptdated,
      select: {
        name: true,
        email: true,
        role: true,
      },
    });

    return response.json({
      updatedTech,
      message: "Atualizado com sucesso ",
    });
  }

  async show(request: Request, response: Response) {
    const tech = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        name: true,
        email: true,
      },
    });

    response.json(tech);
  }

  async indexTickets(request: Request, response: Response) {
    const ticketsAssignedToMe = await prisma.ticket.findMany({
      where: { techId: request.user.id },
      include: { services: { include: { service: true } } },
    });

    const ticketsFormated = ticketsAssignedToMe.map((ticket) => ({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      selectedHour: ticket.selectedHour,
      createdAt: ticket.createdAt,
      services: ticket.services.map((s) => s.service),
    }));

    return response.json({
      message:
        ticketsFormated.length === 0
          ? "Você não tem tickets"
          : "Esses são seus tickets",
      ticketsFormated,
    });
  }

  async updateServiceInTicket(request: Request, response: Response) {
    const bodySchema = z.object({
      ticket_id: z.string().uuid(),
      service_id: z.string().uuid(),
    });

    const { ticket_id, service_id } = bodySchema.parse(request.body);

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticket_id },
      include: { services: true },
    });

    if (!ticket || ticket.status === "encerrado") {
      throw new AppError("Ticket não encontrado ou encerrado", 404);
    }

    const service = await prisma.service.findUnique({
      where: { id: service_id },
    });

    if (!service || !service.active) {
      throw new AppError("Service não encontrado ou inativo", 404);
    }

    if (ticket.techId !== request.user.id) {
      throw new AppError(
        "Você não tem permissaão para editar este ticket",
        401
      );
    }

    const alreadyConnected = ticket.services.some((s) => s.id === service_id);

    if (alreadyConnected) {
      throw new AppError("Serviço já está incluso neste ticket", 400);
    }

    const ticketService = await prisma.ticketServices.create({
      data: {
        ticketId: ticket_id,
        serviceId: service_id,
      },
    });

    return response.json({
      message: "Serviço adicionado ao ticket",
      ticketService,
    });
  }

  async updateTicket(request: Request, response: Response) {
    const paramsSchema = z.object({
      ticket_id: z.string().uuid(),
    });

    const { ticket_id } = paramsSchema.parse(request.params);

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticket_id },
    });

    if (!ticket || ticket.status === "encerrado") {
      throw new AppError("Ticket não encontrado ou encerrado", 404);
    }

    const bodySchema = z.object({
      status: z.enum([TicketStatus.in_progress, TicketStatus.encerrado]),
    });

    const { status } = bodySchema.parse(request.body);

    if (ticket.techId !== request.user.id) {
      throw new AppError(
        "Você não tem autorização para mudar status desse ticket",
        401
      );
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket_id },
      data: { status: status },
      include: { services: { include: { service: true } } },
    });

    return response.json({
      message: "Ticket atualizado com sucesso",
      updatedTicket,
    });
  }
}

export { techController };
