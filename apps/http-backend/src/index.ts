import express from "express"
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "./middleware";
import { CreateUserSchema, SigninSchema, CreateRoomSchema } from "@repo/common/types"
import { prismaClient } from "@repo/db/client";


const app = express();
app.use(express.json());


app.post("/signup", async (req, res) => {

    const parseddata = CreateUserSchema.safeParse(req.body);
    if (!parseddata.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    try {
        const user = await prismaClient.user.create({
            data: {
                email: parseddata.data.username,
                password: parseddata.data.password,
                name: parseddata.data.name
            }


        })
        res.json({
            userID: user.id
        })

    } catch (error) {
        res.status(401).json({
            message: "User already exists"
        })

    }


})
app.post("/signin", async (req, res) => {
    const parseddata = SigninSchema.safeParse(req.body);
    if (!parseddata.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }

    const user = await prismaClient.user.findFirst({
        where: {
            email: parseddata.data.username,
            password: parseddata.data.password
        }
    })
    if (!user) {
        res.status(401).json({
            message: "Invalid credentials"
        })
        return;
    }

    const token = jwt.sign({
        userId: user?.id
    }, JWT_SECRET)
    res.json({
        token
    })

})
app.post("/room", middleware, async (req, res) => {
    const parseddata = CreateRoomSchema.safeParse(req.body);
    if (!parseddata.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    // @ts-ignore  

    const userId = req.userId;
    try {

        const room = await prismaClient.room.create({
            data: {
                slug: parseddata.data.name,
                adminId: userId
            }
        })
        res.json({
            roomId: room.id
        })
    } catch (error) {
        res.status(411).json({
            message: "Room Already exists"
        })
    }


   
})


app.get("/chats/:slug", async (req, res) => {
    try {
        const slug = req.params.slug
        const room = await prismaClient.room.findFirst({
            where: {
                slug
            }
        });

        res.json({
            room
        })
    } catch(e) {
        console.log(e);
        res.json({
            messages: []
        })
    }
    
})
app.get("/chats/:roomId", async (req, res) => {
    try {
        const roomId = Number(req.params.roomId);
        console.log(req.params.roomId);
        const messages = await prismaClient.chat.findMany({
            where: {
                roomId: roomId
            },
            orderBy: {
                id: "desc"
            },
            take: 1000
        });

        res.json({
            messages
        })
    } catch(e) {
        console.log(e);
        res.json({
            messages: []
        })
    }
    
})

app.listen(3001)