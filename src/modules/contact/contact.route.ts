import { Router } from 'express';
import { ContactController } from './contact.controller';
import { validateBody } from '../../middlewares/validate.middleware';
import { createContactSchema } from './contact.validation';

const contactRouter = Router();

/**
 * @route POST /api/contact
 * @desc Public contact form submission endpoint
 * @access Public
 */
contactRouter.post('/', validateBody(createContactSchema), ContactController.submitContactForm);

export const ContactRoutes = contactRouter;
