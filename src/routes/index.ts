import { Router } from 'express';
import v1Router from './v1';
import { AuthRoutes } from '../modules/auth/auth.route';
import { CategoryPublicRoutes, CategoryAdminRoutes } from '../modules/category/category.route';
import { PropertyPublicRoutes, PropertyLandlordRoutes } from '../modules/property/property.route';
import { RentalRoutes, LandlordRentalRoutes } from '../modules/rental/rental.route';
import { PaymentRoutes } from '../modules/payment/payment.route';
import { ReviewRoutes } from '../modules/review/review.route';
import { AdminUserRoutes } from '../modules/admin/admin.route';

const rootRouter = Router();

// Mount Auth Module under /api/auth
rootRouter.use('/auth', AuthRoutes);

// Mount Category Public routes under /api/categories
rootRouter.use('/categories', CategoryPublicRoutes);

// Mount Category Admin routes under /api/admin/categories
rootRouter.use('/admin/categories', CategoryAdminRoutes);

// Mount Property Public routes under /api/properties
rootRouter.use('/properties', PropertyPublicRoutes);

// Mount Property Landlord routes under /api/landlord/properties
rootRouter.use('/landlord/properties', PropertyLandlordRoutes);

// Mount Rental Requests under /api/rentals
rootRouter.use('/rentals', RentalRoutes);

// Mount Landlord Rental Requests management under /api/landlord/requests
rootRouter.use('/landlord/requests', LandlordRentalRoutes);

// Mount Payments under /api/payments
rootRouter.use('/payments', PaymentRoutes);

// Mount Reviews under /api/reviews
rootRouter.use('/reviews', ReviewRoutes);

// Mount Admin User Management under /api/admin/users
rootRouter.use('/admin/users', AdminUserRoutes);

// Mount API versions
rootRouter.use('/v1', v1Router);

export default rootRouter;
