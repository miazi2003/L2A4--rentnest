import { prisma } from '../../config/db';
import { ICreateContactInput } from './contact.interface';

/**
 * Submit a contact form message and persist in the database.
 */
const createContactMessage = async (payload: ICreateContactInput) => {
  return prisma.contactMessage.create({
    data: {
      name: payload.name,
      email: payload.email,
      subject: payload.subject || null,
      message: payload.message,
    },
  });
};

export const ContactService = {
  createContactMessage,
};
