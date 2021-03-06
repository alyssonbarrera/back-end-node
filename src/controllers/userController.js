import users from "../models/userSchema.js";
import bcrypt from "bcrypt"
import profile from '../models/profileSchema.js'
import jwt from "jsonwebtoken"
import cloudinary from '../utils/cloudinary.js'
import upload from '../utils/multer.js' 
import path from "path"

const SECRET = (process.env.SECRET)

class UserController {
    static listarUsuarios = (req, res) => {
        users.find()
        .populate('profile', '-user')
            .exec((err, login) => {
                res.status(200).json(login)
            })
    }

    static listarUsuariosPorId = (req, res) => {
      const id = req.params.id  
      
      users.findById(id)
        .exec((err, users) => {
          if(err) {
            res.status(400).send({message: `${err.message} - Usuário não localizado`})
          } else {
            res.status(200).send(users)
          }
        })
    }

    static criarUsuario = async (req, res) => {

        // acessar as informações para criar nova usuária
  
        try{
          // todo o código que precisa ser executado
          const userExists = await users.findOne({email: req.body.email})

          if(userExists) {
            return res.status(422).json({
                message: 'Email já cadastrado'
            })
        }

          const hashedPassword = bcrypt.hashSync(req.body.password, 10)
          req.body.password = hashedPassword
          const newUser = new users(req.body)
          const newProfile = new profile(req.body)

          // salvar essas informações da nova usuária no banco de dados
          const savedUser = await newUser.save()
          const savedProfile = await newProfile.save()
          users.findOneAndUpdate(
            {_id: savedUser._id}, {$push: {profile: savedProfile}}
            ).exec()
          profile.findOneAndUpdate({_id: savedProfile._id}, {$push: {user: savedUser}}).exec()
      
            const token = jwt.sign({ email: req.body.email }, SECRET)

          // enviar uma resposta da requisição
          res.status(200).send({
            "message": "User adicionado com sucesso",
            savedUser,
            savedProfile,
            token
          })
      
        }catch(err) {
          res.status(500).send({
            "message": err.message
          })
        }
      }

      static atualizarUsuario = (req, res) => {
        
        const hashedPassword = bcrypt.hashSync(req.body.password, 10)
        req.body.password = hashedPassword

        const id = req.params.id

        users.findByIdAndUpdate(id, {$set: req.body}, (err) => {
          if(!err) {
            res.status(200).send({message: 'Usuário atualizado com sucesso'})
          } else {
            res.status(500).send({message: `${err.message} - ID do usuário não localizado`})
          }
        })
      }

      static atualizarImagemUsuário = async (req, res) => {
        const id = req.params.id
        const file = req.file.path
        const userAvatar = await cloudinary.uploader.upload(file);

        users.findByIdAndUpdate(id, {$set: {avatar: userAvatar.url}}, (err) => {
          if(!err) {
            res.status(200).send({message: 'Imagem atualizada com sucesso'})
          } else {
            res.status(500).send({message: `${err.message} - ID do usuário não localizado`})
          }
        })
      }

      static excluirUsuario = (req, res) => {
        const id = req.params.id

        users.findByIdAndDelete(id, (err) => {
          if(!err) {
            res.status(200).send({message: 'Usuário excluído com sucesso'})
          } else {
            res.status(500).send({message: `${err.message} - ID do usuário não localizado`})
          }
        })
      }
}

export default UserController