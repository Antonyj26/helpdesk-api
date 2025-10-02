import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";
import { hash } from "bcrypt";

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
}

export { ClientController };
