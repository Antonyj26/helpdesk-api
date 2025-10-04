import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";
import { compare, hash } from "bcrypt";

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
}

export { techController };
