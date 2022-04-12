const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = users.find((u) => u.username == username);

  if (username && user) {
    request.user = user;
    next();
  } else {
    return response
      .status(400)
      .send({ error: "No user with requested username" });
  }
}

function checksExistsTodoForUser(request, response, next) {
  const { user } = request;
  const { id } = request.params;

  const todo = user.todos.find((todo) => todo.id == id);

  if (!todo) {
    return response.status(404).send({ error: "No todo for requested id" });
  }

  request.todo = todo;
  next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  if (users.find((u) => u.username == username)) {
    return response.status(400).send({ error: "Username already taken" });
  }

  const uuid = uuidv4();
  const newUser = { name, username, id: uuid, todos: [] };
  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.status(200).json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;
  const id = uuidv4();

  const newTodo = {
    id,
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  user.todos.push(newTodo);

  return response.status(201).json(newTodo);
});

app.put(
  "/todos/:id",
  checksExistsUserAccount,
  checksExistsTodoForUser,
  (request, response) => {
    const { todo } = request;
    const { title, deadline } = request.body;

    todo.title = title;
    todo.deadline = new Date(deadline);

    return response.status(200).json(todo);
  }
);

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  checksExistsTodoForUser,
  (request, response) => {
    const { todo } = request;
    todo.done = true;

    return response
      .status(200)
      .json(todo);
  }
);

app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  checksExistsTodoForUser,
  (request, response) => {
    const { user } = request;
    const { id } = request.params;

    const index = user.todos.indexOf((todo) => todo.id == id);

    user.todos.splice(index, 1);

    return response.status(204).send("Todo delete successfully");
  }
);

module.exports = app;
