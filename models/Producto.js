import mongoose from "mongoose";

const ProductoSchema = mongoose.Schema({
  nombre:{
    type:String,
    required:true,
    trim:true
  },
  existencia:{
    type:Number,
    required:true,
    trim:true
  },
  precio:{
    type:Number,
    require:true,
    trim:true
  },
  creado: {
    type: Date,
    default: Date.now
  }

});

const Producto = mongoose.model("Producto", ProductoSchema);
export default Producto;