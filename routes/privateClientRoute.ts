
import express from 'express';
const router = express.Router();

import { getUser } from '../middleware/userDataCapture'

router.get('/profile', (req, res) => {
    const user = getUser()
    res.send(`Hello ${user.username}, this is your profile!`);
});

export default router