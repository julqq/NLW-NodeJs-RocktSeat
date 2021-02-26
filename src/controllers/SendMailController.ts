import { resolve } from "path";
import { Request, Response } from "express";
import { getCustomRepository, RepositoryNotTreeError } from "typeorm";
import { SurveysRepository } from "../repositories/SurveysRepository";
import { SurveysUsersRepository } from "../repositories/SurveysUsersRepository";
import { UsersRepository } from "../repositories/UsersRepository";
import SendMailService from "../services/SendMailService";
import { AppError } from "../errors/AppError";

class SendMailController {
	async execute(request: Request, response: Response) {
		const { email, survey_id } = request.body;
		const usersRepository = getCustomRepository(UsersRepository);
		const surveysRepository = getCustomRepository(SurveysRepository);
		const surveysUsersRepository = getCustomRepository(SurveysUsersRepository);

		const user = await usersRepository.findOne({ email });
		if (!user) {
			throw new AppError("User not exists");
		}
		const survey = await surveysRepository.findOne({
			id: survey_id,
		});

		if (!survey) {
			throw new AppError("Survey does not exists");
		}

		const npsPath = resolve(__dirname, "..", "views", "emails", "npsMail.hbs");
		const surveyUserAlreadyExisits = await surveysUsersRepository.findOne({
			where: { user_id: user.id, value: null },
			relations: ["user", "survey"],
		});

		const variables = {
			name: user.name,
			tittle: survey.tittle,
			description: survey.description,
			id: "",
			link: process.env.URL_MAIL,
		};
		if (surveyUserAlreadyExisits) {
			variables.id = surveyUserAlreadyExisits.id;
			await SendMailService.execute(email, survey.tittle, variables, npsPath);
			return response.json(surveyUserAlreadyExisits);
		}
		//Salvar as informações na tabela surveyUser
		const surveyUser = surveysUsersRepository.create({
			user_id: user.id,
			survey_id,
		});

		await surveysUsersRepository.save(surveyUser);

		//Enviar e-mail para o usuário
		variables.id = surveyUser.id;
		await SendMailService.execute(email, survey.tittle, variables, npsPath);
		return response.json(surveyUser);
	}
}
export { SendMailController };
