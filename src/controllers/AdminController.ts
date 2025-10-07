import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";
import { hash } from "bcrypt";

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

    return response.json(techs);
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

    return response.json(services);
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
      name: z
        .string()
        .trim()
        .min(3, { message: "Nome deve ter pelo menos 3 caracteres" })
        .optional(),
      price: z
        .number({ message: "Preço inválido" })
        .positive({ message: "Preço deve ser maior do que 0" })
        .optional(),
      active: z.boolean().optional(),
    });

    const { name, price, active } = bodySchema.parse(request.body);

    const serviceUpdated = await prisma.service.update({
      where: { id: service_id },
      data: {
        name,
        price,
        active: active ?? true,
      },
    });

    return response.json(serviceUpdated);
  }

  async clientIndex(request: Request, response: Response) {
    const clients = await prisma.user.findMany({ where: { role: "client" } });

    return response.json(clients);
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
    const allTickets = await prisma.ticket.findMany();

    return response.json({
      message: "Esses são todos os tickets do sistema",
      allTickets,
    });
  }
}

export { AdminController };
