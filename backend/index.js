import express from "express"; // node.js framework'ü olan express.js kullandık (kullanımı daha kolay olduğu için)
import mongoose from "mongoose"; // ORM (Object Relational Mapping) for MongoDB (.NET teki Entity Framework gibi, DB şema ve mapping işlemleri)
import cors from "cors"; // farklı port veya domainde tarayıcı cors hatası vermemesi için kullandık.
import consola from "consola"; // konsolda hatalar ve success ler renkli görünmesi için kullandık
import { fileURLToPath } from 'url'; 
import { createServer } from "http"; // node http server create
import path from "path";
import { initializeSocket } from "./socket.js";
import { URL, PORT } from "./config/index.js"; // config => .env port ve db bilgilerine tek yerden erişmek için
import { instrument } from '@socket.io/admin-ui';
import { createSystemUser } from './system.js';
import { connectRedis } from './redis.js'; // Import et

import Auth from './utils/auth.js'
const auth = new Auth();

const { success, error } = consola; // consola destructuring

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express(); // uygulama create
const httpServer = createServer(app); // http server create
const port = PORT; // api nin çalışmasını istediğimiz port

// api routes
// burada routes klasöründe express.Router ile oluşturduğumuz route ları import ediyoruz
// her model için ayrı bir route tanımlarsak, bakımı , geliştirmesi bulması daha kolay olur.
// yoksa hepsi aynı route içinde de olabilirdi ama karman çorman olurdu proje büyüdükçe karmaşıklaşır.


import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

const startApp = async () => {
  try {
    await mongoose.connect(URL);
    await connectRedis();
    const corsOptions = {
      origin: ["http://localhost:5173", "http://localhost:3001"],
      credentials: true,
      optionsSuccessStatus: 200,
    };
    
    await createSystemUser();

    app.use(cors(corsOptions));

    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.static('./node_modules/@socket.io/admin-ui/ui/dist'))
    // api dosya gönderim ve alım limiti 50mb
    app.use(express.json({ limit: "50mb", extended: true }));
    app.use(express.urlencoded({ limit: "50mb", extended: true }));
    app.use(express.text({ limit: "50mb", extended: true }));
    
    // api test için route'suz anasayfada açılan mesaj
    // http://localhost:3001 tıklanınca çalışan servis
    app.get("/", (req, res) => {
      res.send({
        success: true,
        message: "API WORKS!",
      });
    });
    
    //api paths
    // burada import ettiğimiz ve bir const'a atadığımız routelarımızı express.js kullanarak oluşturduğumuz
    // node server a tanımlıyoruz. Nasıl tanımlarsak web'den o şekilde çağırmalıyız
    // örn. http://localhost:3001/users/register gibi
    

    app.use("/users", userRoutes);
    app.use("/chats", chatRoutes);

    // Example: app.use("/users", userRoutes);
    // Example: app.use("/products", productRoutes);
    
    // DB ye bağlandık
    // Node server 'ı ayağa kaldırıyoruz
    const io = initializeSocket(httpServer)

    const password = await auth.hashPassword("adminuser")

    instrument(io, {
      auth: {
        type: "basic",
        username: "admin",
        password: password // password is adminuser
      },
      mode: "development"
    });

    httpServer.listen(port, () =>
      success({
        message: `successfully connected with db on PORT : ${port}`,
        badge: true,
      }),
    );
  } catch (err) {
    // Hata!
    error({
      message: `${err}`,
      badge: true,
    });
  }
};

startApp();

// index.js server'in db'ye bağlandığı ve router'larına bağlandığı yerdir (güvenlik ve limitleme de yapılır)
