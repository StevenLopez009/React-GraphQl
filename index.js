import { ApolloServer } from "apollo-server";
import { typeDefs } from "./db/schema.js";
import { resolvers } from "./db/resolvers.js";
import {conectarDB} from "./config/db.js";
import jwt from "jsonwebtoken"

conectarDB()

// Servidor
const server = new ApolloServer({
    typeDefs, resolvers,context:({req})=>{
        const token = req.headers['authorization']|| '';
        if(token){
            try {
                const usuario= jwt.verify(token, process.env.SECRETA)
                return {
                    usuario
                }
            } catch (error) {
                console.log(error)
            }
        }
    }
    
});

// Iniciar el servidor
server.listen().then(({ url }) => {
    console.log(`Servidor listo en la URL ${url}`);
});
