import { Router } from 'express';

import member1Routes from '../modules/member1/routes/index.js';
import member2Routes from '../modules/member2/routes/index.js';
import member3Routes from '../modules/member3/routes/index.js';
import member4Routes from '../modules/member4/routes/index.js';

const router = Router();

// Member 1 routes
router.use(member1Routes);

// Member 2 routes
router.use(member2Routes);

// Member 3 routes
router.use(member3Routes);

// Member 4 routes
router.use(member4Routes);

export default router;