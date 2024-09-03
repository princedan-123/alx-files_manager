import express from 'express';
//const { express } = pkg;

import router from './routes/index.js';

const app = express();
app.use(express.json());
app.use('/', router);
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
