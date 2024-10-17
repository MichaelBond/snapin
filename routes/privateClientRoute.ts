
import express from 'express';
const router = express.Router();

router.get('/profile', (req, res) => {
    res.send(`Hello ${req.user?.username}, this is your profile!`);
});

export default router