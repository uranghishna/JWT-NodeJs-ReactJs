import Users from "../models/UserModel.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const getUsers = async (req, res) => {
  try {
    const users = await Users.findAll();
    res.json(users);
  } catch (error) {
    console.log(error);
  }
}

export const Register = async (req, res) => {
  const { name, email, password, confPassword } = req.body;
  if(password !== confPassword) {
    return res.status(400).json({msg: "Passwords do not match" });
  }
  const salt = await bcrypt.genSalt();
  const hashPassword = await bcrypt.hash(password, salt);
  try {
    await Users.create({
      name: name,
      email: email,
      password: hashPassword
    });
    res.json({msg: "registered"});
  } catch (error) {
    console.log(error);
  }
}

export const Login = async (req, res) => {
  try {
    const user = await Users.findOne({
      where: {
        email: req.body.email
      }
    });
    const match = await bcrypt.compare(req.body.password, user[0].password);
    if(!match) return res.status(400).json({msg: "Invalid Password"});
    const userId = user[0].id;
    const name = user[0].name;
    const email = user[0].email;
    const accessToken = jwt.sign({userId, name, email}, process.env.ACCESS_TOKEN_SECRET,{
      expiresIn: '20s'
    });
    const refreshToken = jwt.sign({userId, name, email}, process.env.REFRESH_TOKEN_SECRET,{
      expiresIn: '1d'
    });
    await Users.update({refresh_token: refreshToken}, 
      {where:
         {id: userId
        }
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
        // secure: true,
        // sameSite: true
      });
      res.json({accessToken});
  } catch (error) {
    res.status(404).json({msg: "Email not found"});
  }
}