import { getCookie } from "cookies-next";

export enum QueryOrder {
    Asc = "asc",
    Desc = "desc"
}

export const GetResponseBody = async <T>(relativePath: string): Promise<[number, T]> => {
	let responseStatus: number = -1;
	let responseBody: T = {} as T;

	try {
		const response: Response = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + relativePath, {
			headers: {
				"content-type": "application/json",
				"sessionId": getCookie("sessionId")?.toString() || ""
			},
			method: "GET"
		});

		responseStatus = response.status

		if(response.status === 200) {
			responseBody = (await response.json()) as T;
		}
	}
	catch (error) {
		responseStatus = 503;
		console.log(error);
	}

	return [responseStatus, responseBody];
}

export const PostResponseBody = async <T1, T2>(relativePath: string, requestBody: T1): Promise<[number, T2]> => {
	let responseStatus: number = -1;
	let responseBody: T2 = {} as T2;
	console.log("1: " + process.env.NEXT_PUBLIC_API_BASE_URL);
	try {
		const response: Response = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + relativePath, {
			headers: {
				"content-type": "application/json",
				"sessionId": getCookie("sessionId")?.toString() || ""
			},
			method: "POST",
			body: JSON.stringify(requestBody)
		});

		responseStatus = response.status

		if(response.status === 200) {
			responseBody = await response.json();
		}
	}
	catch (error) {
		responseStatus = 503;
		console.log(error);
	}

	return [responseStatus, responseBody];
}

export const PutResponseBody = async <T1, T2>(relativePath: string, requestBody: T1): Promise<[number, T2]> => {
	let responseStatus: number = -1;
	let responseBody: T2 = {} as T2;

	try {
		const response: Response = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + relativePath, {
			headers: {
				"content-type": "application/json",
				"sessionId": getCookie("sessionId")?.toString() || ""
			},
			method: "PUT",
			body: JSON.stringify(requestBody)
		});

		responseStatus = response.status

		if(response.status === 200) {
			responseBody = await response.json();
		}
	}
	catch (error) {
		responseStatus = 503;
		console.log(error);
	}

	return [responseStatus, responseBody];
}

export const DeleteResponseBody = async (relativePath: string): Promise<number> => {
	let responseStatus: number = -1;

	try {
		const response: Response = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + relativePath, {
			headers: {
				"content-type": "application/json",
				"sessionId": getCookie("sessionId")?.toString() || ""
			},
			method: "DELETE"
		});

		responseStatus = response.status
	}
	catch (error) {
		responseStatus = 503;
		console.log(error);
	}

	return responseStatus;
}