import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: 'variables.env' });

const conectarDB = async () => {
  try {
    await mongoose.connect(process.env.DB_MONGO, {
     
    });
    console.log('DB conectada');
  } catch (error) {
    console.log('Hubo un error:', error);
    process.exit(1); // Detiene la aplicación si hay un error de conexión
  }
};

export {
  conectarDB
}