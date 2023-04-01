const express = require("express");
const { Todo } = require("../mongo");
const router = express.Router();
const redis = require("redis");
const { promisify } = require("util");

const redisClient = redis.createClient();
const getAsync = promisify(redisClient.get).bind(redisClient); // Initialize the getAsync function
const setAsync = promisify(redisClient.set).bind(redisClient); // Initialize the setAsync function

/* GET todos listing. */
router.get("/", async (_, res) => {
  const todos = await Todo.find({});
  res.send(todos);
});

/* POST todo to listing. */
router.post("/", async (req, res) => {
  const todo = await Todo.create({
    text: req.body.text,
    done: false,
  });

  const todoCounter = Number(await getAsync("todoCounter")) || 0;
  await setAsync("todoCounter", todoCounter + 1);

  res.send(todo);
});

/* GET statistics. */
router.get("/statistics", async (req, res) => {
  const addedTodos = Number(await getAsync("todoCounter")) || 0;
  res.json({
    added_todos: addedTodos,
  });
});

const singleRouter = express.Router();

const findByIdMiddleware = async (req, res, next) => {
  const { id } = req.params;
  req.todo = await Todo.findById(id);
  if (!req.todo) return res.sendStatus(404);

  next();
};

/* DELETE todo. */
singleRouter.delete("/", async (req, res) => {
  await req.todo.delete();
  res.sendStatus(200);
});

/* GET todo. */
singleRouter.get("/", async (req, res) => {
  res.send(req.todo);
});

/* PUT todo. */
singleRouter.put("/", async (req, res) => {
  const { todo } = req;
  todo.text = req.body.text;
  todo.done = req.body.done || false;
  await todo.save();
  res.send(todo);
});

router.use("/:id", findByIdMiddleware, singleRouter);

module.exports = router;
