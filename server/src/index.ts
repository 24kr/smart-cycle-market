import "express-async-errors";
import "src/db";
import express from "express";
import authRouter from "routes/auth";

const app = express();

app.use(express.static("src/public"));

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

app.use("/auth", authRouter);

app.use(function(err,req, res, next){
    res.status(500).json({massage: err.message});
}as express.ErrorRequestHandler);

app.listen(8000, () =>{

console.log("The app is running on http://localhost:8000");
});
























// import { RequestHandler } from "express-serve-static-core";


// const bodyParser: RequestHandler = (req, res, next) => {
    //     req.on ('data', (chunk) =>{
        //         req.body = JSON.parse(chunk);
        //         next();
        
//     });
// }
// app.get("/", (req, res) => {
//     res.json({message:"Message from server is not valid"});
// });

// app.use(bodyParser)
// app.post("/", (req, res) => {
//     console.log(req.body);
//     res.json({message:"Message from server is coming from post request"});
// }); 

// app.post("/create-new-product", (req, res) => {
    //     console.log(req.body);
    //     res.json({message:"Message from server is coming from product create"});
    // }); 
    