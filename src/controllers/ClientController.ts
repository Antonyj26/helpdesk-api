import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";
import { compare, hash } from "bcrypt";
import { da } from "zod/locales";

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
}

export { ClientController };
