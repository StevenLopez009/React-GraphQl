import Usuario from "../models/usuarios.js"
import Producto from "../models/Producto.js";
import Cliente from "../models/Cliente.js";
import Pedido from "../models/Pedido.js";

import bcryptjs from "bcryptjs"
import jwt from "jsonwebtoken"
import dotenv from 'dotenv';

dotenv.config({ path: 'variables.env' });

const crearToken = (usuario, secreta, expiresIn)=>{
  const {id, email, nombre, apellido}= usuario;
  return jwt.sign({id}, secreta,{expiresIn})
}

// Resolvers
export const resolvers = {
  Query: {
     obtenerUsuario:async (_,{token})=>{
      const usuarioId= await jwt.verify(token, process.env.SECRETA)
      return usuarioId
     },
     obtenerProductos: async ()=>{
      try {
        const productos= await Producto.find({});
        return productos;
      } catch (error) {
        console.log(error)
      }
     },
     obtenerProducto: async (_, {id})=>{
      const producto= await Producto.findById(id);
      if(!producto){
        throw new Error('Producto no encontrado')
      }
      return producto
     },
     obtenerClientes: async ()=>{
      try{
        const clientes= await Cliente.find({});
        return clientes;
      }catch (error){
        console.log(error)
      }
     },
     obtenerClientesVendedor:async (_,{},ctx)=>{
      try{
        const clientes= await Cliente.find({vendedor:ctx.usuario.id.toString()});
        return clientes;
      }catch (error){
        console.log(error)
      }
     },
     obtenerCliente:async(_,{id},ctx)=>{
      //revisar si el cliente existe
      const cliente = await Cliente.findById(id);
      if(!cliente){
        throw new Error ('Cliente no encontrado')
      }
      //Quien puede verlo
      if(cliente.vendedor.toString() !== ctx.usuario.id){
        throw new Error('No tienes las credenciales')
      }
      return cliente;
     },
     obtenerPedidos:async()=>{
      try {
        const pedidos = await Pedido.find({})
        return pedidos
      } catch (error) {
        console.log(error)
      }
     },
     obtenerPedidosVendedor:async(_,{},ctx)=>{
      try {
        const pedidos = await Pedido.find({vendedor:ctx.usuario.id})
        return pedidos
      } catch (error) {
        console.log(error)
      }
     },
     obtenerPedido:async(_,{id},ctx)=>{
      //Si el pedido existe o no
      const pedido=await Pedido.findById(id);
      if(!pedido){
        throw new Error("Pedido no encontrado")
      }
      //Solo quien lo creo puede verlo
      if(pedido.vendedor.toString() !== ctx.usuario.id){
        throw new Error('No tienes las credenciales')
      }
      //retornar el pedido
      return pedido;
     },
     obtenerPedidosEstado: async (_,{estado},ctx)=>{
      const pedidos= await Pedido.find({vendedor:ctx.usuario.id,estado});
      return pedidos;
     },

     mejoresClientes : async () => {
      const clientes = await Pedido.aggregate([
        {$match: { estado: "COMPLETADO" }},
        {$group: {
            _id: "$cliente",
            total: { $sum: "$total" }
          }},
        {$lookup: {
            from: "clientes",
            localField: "_id",
            foreignField: "_id",
            as: "cliente"
          }},
          { $sort: { total: -1 } }
      ]);
      return clientes;
    },
    mejoresVendedores:async()=>{
      const vendedores= await Pedido.aggregate([
        {$match:{estado:"COMPLETADO"}},
        {$group:{
          _id: "$vendedor",
          total: { $sum: "$total" }
        }},
        {$lookup: {
          from: "usuarios",
          localField: "_id",
          foreignField: "_id",
          as: "vendedor"
        }},
        { $limit:2 },
        {
          $sort:{total:-1}
        }
      ]);
      return vendedores;
    },
    buscarProducto:async(_,{texto})=>{
      const productos= await Producto.find({$text:{$search:texto}})
      return productos;
    }
  },
  Mutation:{
      nuevoUsuario: async (_, {input})=>{
        const {email,password}= input;
        //revisar si el usuario ya esta registrado
        const existeUsuario = await Usuario.findOne({email});
        if(existeUsuario){
          throw new Error('El usuario ya existe')
        }
       //Encriptar password
       const salt =await bcryptjs.genSalt(10)
       input.password = await bcryptjs.hash(password, salt)
        try {
           //Guardar en la base de datos
          const usuario = new Usuario(input);
          usuario.save();
          return usuario
        } catch (error) {
          console.log(error)
        }
      },
      autenticarUsuario: async  (_, { input })=>{
        const {email,password}= input;
        //si el usuario existe
        const existeUsuario = await Usuario.findOne({email});
        if(!existeUsuario){
          throw new Error('El usuario no existe')
        }
        //revisar si el password es correcto
        const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password)
        if(!passwordCorrecto){
          throw new Error('El Password es incorrecto')
        }
        //Crear token
        return {
          token: crearToken(existeUsuario, process.env.SECRETA, '24h')
        }
      },
      nuevoProducto:async (_, {input})=>{
        try {
          const producto = new Producto(input)
          //almacenar en db
          const resultado = await producto.save();
          return resultado;

        } catch (error) {
          console.log(error)
        }
      },
      actualizarProducto:async(_,{id,input})=>{
        //revisar si el producto existe
        let producto= await Producto.findById(id);
        if(!producto){
          throw new Error('Producto no encontrado')
        }
        //editar y guardar
        producto= await Producto.findOneAndUpdate({_id:id}, input, {new:true});
        return producto;
      },
      eliminarProducto:async(_,{id})=>{
         //revisar si el producto existe
         let producto= await Producto.findById(id);
         if(!producto){
           throw new Error('Producto no encontrado')
         }
         //eliminar
         await Producto.findOneAndDelete({_id:id})
         return "Producto eliminado"
      },
       nuevoCliente :async (_, { input }, ctx) => {
        // Verificar si el cliente ya está registrado
        const { email } = input;
        const cliente = await Cliente.findOne({ email });
        
        if (cliente) {
          throw new Error('Cliente ya está registrado');
        }
      
        // Crear y asignar el vendedor al nuevo cliente
        const nuevoCliente = new Cliente(input);
        nuevoCliente.vendedor = ctx.usuario.id;
        
        // Guardar en la base de datos
        try {
          const resultado = await nuevoCliente.save();
          return resultado;
        } catch (error) {
          console.log(error);
          throw new Error('Error al guardar el nuevo cliente');
        }
      },
      actualizarCliente:async(_,{id,input},ctx)=>{
      console.log('ID:', id); // Verificar si el ID se está recibiendo correctamente
      console.log('Input:', input); // Verificar si el input se está recibiendo correctamente
      console.log('Context:', ctx); // Verificar el contexto completo

      if (!ctx.usuario) {
        throw new Error('Usuario no autenticado');
      }
      console.log('Usuario ID:', ctx.usuario.id);
        //verificar si existe
        let cliente = await Cliente.findById(id)
        if(!cliente){
          throw new Error('El cliente no existe')
        }
        //verificar si el vendedor  es quien edita
        if(cliente.vendedor.toString() !== ctx.usuario.id){
          throw new Error('No tienes las credenciales')
        }
        //guardar el cliente
        cliente= await Cliente.findOneAndUpdate({_id:id},input,{new:true})
        return cliente
      },
      eliminarCliente:async(_,{id},ctx)=>{
        //verificar si existe
        let cliente = await Cliente.findById(id)
        if(!cliente){
          throw new Error('El cliente no existe')
        }
        //verificar si el vendedor  es quien edita
        if(cliente.vendedor.toString() !== ctx.usuario.id){
          throw new Error('No tienes las credenciales')
        }
        //Eliminar cliente
        await Cliente.findOneAndDelete({_id:id})
        return "Cliente eliminado"
      },
      nuevoPedido:async(_,{input},ctx)=>{
        const {cliente}=input
        //verificar si existe o no
        let clienteExiste = await Cliente.findById(cliente);
        if(!clienteExiste){
          throw new Error('Cliente no existe')
        }
        //verificar si el cliente es del vendedor
        if(clienteExiste.vendedor.toString() !== ctx.usuario.id){
          throw new Error('No tienes las credenciales')
        }
        //revisar el stock disponible
        for await(const articulo of input.pedido){
          const {id}= articulo
          const producto = await Producto.findById(id);
          if(articulo.cantidad >producto.existencia){
            throw new Error(`El articulo: ${producto.nombre} excede la cantidad disponible`)
          }else{
            //restar la cantidad a lo disponible
            producto.existencia= producto.existencia-articulo.cantidad
            await producto.save()
          }
        }
        //Crear nuevo pedido
        const nuevoPedido = new Pedido(input)
        //asignarle un vendedor
        nuevoPedido.vendedor= ctx.usuario.id;
        //guardarlo en db
        const resultado = await nuevoPedido.save()
        return resultado;
      },
      actualizarPedido: async(_,{id,input}, ctx)=>{
        //si pedido existe
        let existePedido = await Pedido.findById(id)
        if(!existePedido){
          throw new Error("Pedido no existe")
        }
        //si el cliente existe
        const {cliente}= input
        let clienteExiste = await Cliente.findById(cliente);
        if(!clienteExiste){
          throw new Error('Cliente no existe')
        }
        // si el cliente y pedido pertenecen al vendedor
        if(clienteExiste.vendedor.toString() !== ctx.usuario.id){
          throw new Error('No tienes las credenciales')
        }

        //revisar el stock
        if(input.pedido){
          for await(const articulo of input.pedido){
            const {id}= articulo
            const producto = await Producto.findById(id);
            if(articulo.cantidad >producto.existencia){
              throw new Error(`El articulo: ${producto.nombre} excede la cantidad disponible`)
            }else{
              //restar la cantidad a lo disponible
              producto.existencia= producto.existencia-articulo.cantidad
              await producto.save()
            }
          }
        }
        //guardar el pedido
        const resultado = await Pedido.findOneAndUpdate({_id:id}, input, {new:true})
        return resultado;
      },
      eliminarPedido: async (_,{id}, ctx)=>{
         //verificar si existe el pedido
         let pedidoExiste = await Pedido.findById(id)
         if(!pedidoExiste){
           throw new Error('El pedido no existe')
         }
         //verificar si el vendedor  es quien elimina
         if(pedidoExiste.vendedor.toString() !== ctx.usuario.id){
           throw new Error('No tienes las credenciales')
         }
         //Eliminar pedido
         await Pedido.findOneAndDelete({_id:id})
         return "Pedido eliminado"
      }
  }
};

