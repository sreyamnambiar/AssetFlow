import { Router } from 'express';
import member1Routes from '../modules/member1/routes/index.js';
import member2Routes from '../modules/member2/routes/index.js';
import member3Routes from '../modules/member3/routes/index.js';
import member4Routes from '../modules/member4/routes/index.js';

const router = Router();

router.use(member1Routes);
router.use(member2Routes);
router.use(member3Routes);
router.use(member4Routes);

export default router;