import express from 'express';
//const { express } = pkg;
import AppContoller from '../contollers/AppContoller.js';
import UsersContoller from '../contollers/UsersController.js';

const router = express.Router();

router.get('/status', AppContoller.getStatus);
router.get('/stats', AppContoller.getStats);
router.post('/users', UsersContoller.postNew);
export default router;
