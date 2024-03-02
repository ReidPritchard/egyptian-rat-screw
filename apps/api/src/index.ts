import { info } from '@oers/utils';
import app from './server';
import setupMiddleware from './middleware';

const port = process.env.PORT || 5001;

setupMiddleware(app);

app.listen(port, () => {
  info(`Server started on http://localhost:${port}/`);
});
