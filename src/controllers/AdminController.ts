import { Request, Response } from "express";
import { email, includes, z } from "zod";
import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";
import { hash } from "bcrypt";
import { TicketStatus } from "@prisma/client";
import { title } from "process";

class AdminController {
  async createTech(request: Request, response: Response) {
    const bodySchema = z.object({
      name: z.string().trim().min(2, { message: "Nome é obrigátorio" }),
      email: z.string().trim().email({ message: "E-mail inválido" }),
      password: z.string().min(6, { message: "A senha deve ter 6 caractes" }),
    });

    const { name, email, password } = bodySchema.parse(request.body);

    const userWithSameEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (userWithSameEmail) {
      throw new AppError("Já existe um usuário cadastrado com esse e-mail");
    }

    const hashedPassword = await hash(password, 8);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "tech",
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    return response.status(201).json(userWithoutPassword);
  }

  async indexTechs(request: Request, response: Response) {
    const techs = await prisma.user.findMany({
      where: { role: "tech" },
      select: {
        id: true,
        name: true,
        email: true,
        techAvailability: {
          select: {
            availableHours: true,
          },
        },
      },
    });

    const techsFormatted = techs.map((tech) => ({
      id: tech.id,
      name: tech.name,
      email: tech.email,
      availableHours: tech.techAvailability?.availableHours,
    }));

    return response.json({ techs: techsFormatted });
  }

  async updateTech(request: Request, response: Response) {
    const paramSchema = z.object({
      tech_id: z.string().uuid(),
    });

    const { tech_id } = paramSchema.parse(request.params);

    const tech = await prisma.user.findUnique({ where: { id: tech_id } });

    if (!tech) {
      throw new AppError("Tech not found", 404);
    }

    const bodySchema = z.object({
      name: z
        .string()
        .trim()
        .min(2, { message: "Nome é obrigátorio" })
        .optional(),
      email: z.string().trim().email({ message: "E-mail inválido" }).optional(),
    });

    const { name, email } = bodySchema.parse(request.body);

    const userUpdate = await prisma.user.update({
      where: { id: tech_id },
      data: {
        name,
        email,
      },
    });

    const { password: _, ...userWithoutPassword } = userUpdate;

    return response.json(userWithoutPassword);
  }

  async createService(request: Request, response: Response) {
    const bodySchema = z.object({
      name: z
        .string()
        .trim()
        .min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
      price: z
        .number({ message: "Preço inválido" })
        .positive({ message: "Preço deve ser maior que 0" }),
    });

    const { name, price } = bodySchema.parse(request.body);

    const existingName = await prisma.service.findFirst({
      where: { name },
    });

    if (existingName) {
      throw new AppError("Já existe um serviço com esse nome");
    }

    const service = await prisma.service.create({
      data: {
        name,
        price,
      },
    });

    return response.status(202).json(service);
  }

  async indexServices(request: Request, response: Response) {
    const services = await prisma.service.findMany();

    const servicesFormatted = services.map((service) => ({
      id: service.id,
      name: service.name,
      price: service.price,
      status: service.active,
    }));

    return response.json({ services: servicesFormatted });
  }

  async updateService(request: Request, response: Response) {
    const paramSchema = z.object({
      service_id: z.string().uuid(),
    });

    const { service_id } = paramSchema.parse(request.params);

    const service = await prisma.service.findUnique({
      where: { id: service_id },
    });

    if (!service) {
      throw new AppError("Service not found", 404);
    }

    const bodySchema = z.object({
      status: z.boolean().optional(),
    });

    const { status } = bodySchema.parse(request.body);

    const serviceUpdated = await prisma.service.update({
      where: { id: service_id },
      data: {
        active: status ?? true,
      },
    });

    return response.json(serviceUpdated);
  }

  async deleteService(request: Request, response: Response) {
    const paramSchema = z.object({
      service_id: z.string().uuid(),
    });

    const { service_id } = paramSchema.parse(request.params);

    const service = await prisma.service.findUnique({
      where: { id: service_id },
    });

    if (!service) {
      throw new AppError("Serviço não encontrado", 404);
    }

    await prisma.service.delete({ where: { id: service_id } });

    return response.json({ message: "Serviço excluído com sucesso" });
  }

  async clientIndex(request: Request, response: Response) {
    const clients = await prisma.user.findMany({
      where: { role: "client" },
      select: { name: true, email: true },
    });

    const clientsFormatted = clients.map((client) => ({
      name: client.name,
      email: client.email,
    }));

    return response.json({ clients: clientsFormatted });
  }

  async updateClient(request: Request, response: Response) {
    const paramsSchema = z.object({
      client_id: z.string().uuid(),
    });

    const { client_id } = paramsSchema.parse(request.params);

    const client = prisma.user.findUnique({ where: { id: client_id } });

    if (!client) {
      throw new AppError("Client not found", 404);
    }

    const bodySchema = z.object({
      name: z
        .string()
        .trim()
        .min(2, { message: "Nome deve ter pelo menos 2 carcteres" })
        .optional(),
      email: z
        .string()
        .trim()
        .email({ message: "email inválido" })
        .toLowerCase()
        .optional(),
    });

    const { name, email } = bodySchema.parse(request.body);

    const updatedClient = await prisma.user.update({
      where: { id: client_id },
      data: {
        name,
        email,
      },
    });

    return response.json(updatedClient);
  }

  async deleteClient(request: Request, response: Response) {
    try {
      const paramSchema = z.object({
        client_id: z.string().uuid(),
      });

      const { client_id } = paramSchema.parse(request.params);

      const client = await prisma.user.findUnique({
        where: { id: client_id },
      });

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
    } catch (error) {
      return response.json(error);
    }
  }

  async createTechAvailability(request: Request, response: Response) {
    const bodySchema = z.object({
      tech_id: z.string().uuid(),
      availableHours: z
        .array(
          z.string().regex(/^([0-1]\d|2[0-3]):([0-5]\d)$/, {
            message: "Horário deve estar no formato HH:MM",
          })
        )
        .nonempty("Lista de horários não pode estar vazia"),
    });

    const { tech_id, availableHours } = bodySchema.parse(request.body);

    const tech = await prisma.user.findUnique({ where: { id: tech_id } });

    if (!tech) {
      throw new AppError("Tech not found", 404);
    }

    const existingAvailability = await prisma.techAvailability.findUnique({
      where: { techId: tech_id },
    });

    let availability;

    if (existingAvailability) {
      availability = await prisma.techAvailability.update({
        where: { techId: tech_id },
        data: { availableHours },
      });
    } else {
      availability = await prisma.techAvailability.create({
        data: {
          techId: tech_id,
          availableHours,
        },
      });
    }

    return response.status(200).json({
      message: "Disponibilidade do técnico atualizada com sucesso",
      availability,
    });
  }

  async indexTickets(request: Request, response: Response) {
    const allTickets = await prisma.ticket.findMany({
      include: {
        client: { select: { name: true } },
        tech: { select: { id: true, name: true } },
        services: {
          select: { service: { select: { name: true, price: true } } },
        },
      },
    });

    const formattedTickets = allTickets.map((ticket) => ({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      updatedAt: ticket.updatedAt,
      client: ticket.client.name,
      tech_id: ticket.techId,
      tech: ticket.tech.name,
      services: ticket.services.map((s) => s.service.name),
      price: ticket.services.map((p) => p.service.price),
    }));

    return response.json({
      message: "Esses são todos os tickets do sistema",
      allTickets: formattedTickets,
    });
  }

  async updateTicket(request: Request, response: Response) {
    const paramsSchema = z.object({
      ticket_id: z.string().uuid(),
    });

    const { ticket_id } = paramsSchema.parse(request.params);

    const ticket = await prisma.ticket.findUnique({ where: { id: ticket_id } });

    if (!ticket) {
      throw new AppError("Ticket não encontrado", 404);
    }

    const bodySchema = z.object({
      status: z.enum([
        TicketStatus.open,
        TicketStatus.in_progress,
        TicketStatus.encerrado,
      ]),
    });

    const { status } = bodySchema.parse(request.body);

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket_id },
      data: { status: status },
      include: { services: { include: { service: true } } },
    });

    return response.json({
      message: "Status do ticket atualizado com sucesso",
      updatedTicket,
    });
  }

  async deleteTicket(request: Request, response: Response) {
    try {
      const paramsSchema = z.object({
        ticket_id: z.string().uuid(),
      });

      const { ticket_id } = paramsSchema.parse(request.params);

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticket_id },
      });

      if (!ticket) {
        throw new AppError("Ticket não localizado", 404);
      }

      await prisma.ticketServices.deleteMany({
        where: { ticketId: ticket_id },
      });

      await prisma.ticket.delete({ where: { id: ticket_id } });

      return response.json({ message: "Ticket excluído com sucesso" });
    } catch (error) {
      console.log(error);
    }
  }
}

export { AdminController };
