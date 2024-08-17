import mongoose from 'mongoose';

export default async function connectDB() {
    const MONGO_URI = process.env.MONGO_URI;

    try {
        const clientOptions = {
            serverApi: { version: '1', strict: true, deprecationErrors: true },
        };

        const connection = await mongoose.connect(MONGO_URI, clientOptions);
        console.log(
            `MongoDB connection established successfully. Connected to MongoDB: ${connection.connections[0].host} - Database: ${connection.connections[0].name} - Status: ${connection.connections[0].readyState}`
        );
    } catch (err) {
        console.error('Something went wrong in connecting mongodb', err);
        process.exit(1);
    }
}
