import fs from 'fs';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const id = '1zTTeh2DPc5uXM860KTvblMXUj4FyIhTOCdfqCjtdDQY';
const SERVICE_ACCOUNT_EMAIL = 'translator@sdg-2022.iam.gserviceaccount.com';
const SERVICE_ACCOUNT_KEY = '../.sdg-2022-09287f4359cb.json';

const delay = (n) => new Promise((resolve) => setTimeout(resolve, n * 1000));

async function download() {
	try {
		const creds = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_KEY, { encoding: 'utf8', flag: 'r' }));

		const auth = new JWT({
			email: creds.client_email,
			key: creds.private_key,
			scopes: ['https://www.googleapis.com/auth/spreadsheets']
		});

		const doc = new GoogleSpreadsheet(id, auth);

		await doc.loadInfo();

		const firstSheet = doc.sheetsByIndex[0];
		const rows = await firstSheet.getRows();

		let result = {};

		for (let row of rows) {
			const rowObj = row.toObject();
			result[rowObj['key']] = rowObj['en'];
		}

		fs.writeFileSync('../src/lib/i18n/locales/en.json', JSON.stringify(result, null, 2));

		console.log('done.');
	} catch (e) {
		console.log(e);
	}
}

download();
