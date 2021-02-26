import request from "supertest";
import { getConnection } from "typeorm";
import { app } from "../app";
import createConnection from "../database";

describe("Surveys", () => {
	beforeAll(async () => {
		const connection = await createConnection();
		await connection.runMigrations();
	});
	afterAll(async () => {
		const connection = getConnection();
		await connection.dropDatabase();
		await connection.close();
	});
	it("Should be able to create a new Surveys ", async () => {
		const reponse = await request(app)
			.post("/surveys")
			.send({ tittle: "Tittle Example", description: "Description Example" });
		expect(reponse.status).toBe(201);
		expect(reponse.body).toHaveProperty("id");
	});
});
