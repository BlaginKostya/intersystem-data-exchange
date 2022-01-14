import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { promises } from 'fs';

dotenv.config();

const host = process.env.HOST;
const port = process.env.PORT;

const app = express();

// Добавляем промежуточную обработку тела запроса в виде JSON и лимит.
app.use(bodyParser.json({
	limit: '50mb'
}));

// В случае корневого запроса GET, перенаправление на сайт.
app.get('/', (req, res) => {
	res.redirect('https://blagin.ru');
});

// Получение и обработка данных от мобильного приложения 1С.
app.post('/add', async (req, res) => {

	try {

		// Деструктуризация входящего объекта JSON.
		const { id, data } = req.body;

		// В случае отсутствия данных, отправляем ошибку.
		if (!id || !data) {
			return res.status(400).json({
				status: 'error',
				message: 'В запросе отсутствуют необходимые данные.'
			});
		}

		// Сохраняем полученные данные в файл.
		await promises.writeFile(`files/${id}`, data);

		// Данные получены и обработаны.
		res.status(200).json({
			status: 'ok',
			message: 'Данные получены.'
		});

	} catch (error) {
		console.log(error.message);
		return res.status(500).json({
			status: 'error',
			message: error.message
		});
	}

});

// Отправка данных основному приложению 1С.
app.get('/get', async (req, res) => {

	try {

		// Массив для объектов файлов.
		let arrayObjects = [];

		// Чтение всех файлов в директории.
		const files = await promises.readdir('files/');
		for (const name of files) {

			// Чтение конкретного файла из директории.
			const data = await promises.readFile(`files/${name}`);

			// Формирование объекта содержащего данные файла.
			const objectFile = {
				id: name,
				data: Buffer.from(data).toString()
			};

			// Добавление объекта в массив.
			arrayObjects.push(objectFile);
		}

		// Отправка данных.
		res.status(200).json({
			status: 'ok',
			message: arrayObjects
		});

		// Удаление отправленных файлов.
		for (const name of files) {
			await promises.unlink(`files/${name}`);
		}

	} catch (error) {
		console.log(error.message);
		return res.status(500).json({
			status: 'error',
			message: error.message
		});
	}

});

// Запуск сервера.
app.listen(port, host, () => {
	console.log(`Сервер запущен на http://${host}:${port}`)
});
