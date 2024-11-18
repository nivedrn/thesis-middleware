const redis = require("redis");
const { fetchFromColorMap } = require("../utilities/getColorCode");

const client = redis.createClient({ url: "redis://localhost:6379" });

async function storeSessionData(sessionId, sessionData) {
	try {
		if (!client.isOpen) {
			await client.connect();
		}
		const sessionDataString = JSON.stringify(sessionData);
		await client.hSet(sessionId, "sessionData", sessionDataString);
		console.log(`Room data stored for session ID: ${sessionId}`);
	} catch (error) {
		console.error("Error storing room data in Redis:", error);
	}
}

async function retrieveSessionData(sessionId) {
	try {
		if (!client.isOpen) {
			await client.connect();
		}
		const sessionDataString = await client.hGet(sessionId, "sessionData");

		if (sessionDataString !== null) {
			const sessionData = JSON.parse(sessionDataString); // Parse JSON back to a JS object
			return sessionData;
		} else {
			console.log(`No room data found for delivery ID: ${sessionId}`);
			return null; // Indicate no data found
		}
	} catch (error) {
		console.error("Error retrieving room data from Redis:", error);
		return null; // Indicate retrieval error
	}
}

module.exports = (io) => {
	io.on("connection", async (socket) => {
		socket.on("join-room", async (sessionId, mode, clientDetails) => {
			socket.join(sessionId);
			console.log(socket.id + " joined ROOM ID:" + sessionId + " as " + mode);

			let sessionData = await retrieveSessionData(sessionId);
			if (!sessionData) {
				console.log("Getting reset");
				sessionData = {
					workspaceData: [{}],
					participants: [],
				};
			}

			existingClient = sessionData.participants.find(
				(item) => item.id === clientDetails.id
			);
			if (existingClient) {
				existingClient.name = clientDetails.name;
				existingClient.socketId = socket.id;
			} else {
				clientDetails.color = fetchFromColorMap(
					sessionData.participants.length
				);
				clientDetails.socketId = socket.id;
				sessionData.participants.push(clientDetails);
			}

			await storeSessionData(sessionId, sessionData);

			if (mode == "participant") {
				if (sessionData) {
					io.in(sessionId).emit("updateWorkspace", sessionData.workspaceData);
					console.log(sessionData);
				} else {
					console.error(
						`Error: Delivery ID ${sessionId} not found in room data.`
					);
				}
			}

			io.in(sessionId).emit("updateParticipants", sessionData.participants);
		});

		socket.on("update-workspace", async (sessionId, workspaceData) => {
			let sessionData = await retrieveSessionData(sessionId);
			console.log(JSON.stringify(workspaceData));
			if (!sessionData) {
				sessionData = {
					workspaceData: workspaceData,
					participants: [],
				};
				await storeSessionData(sessionId, sessionData);
			}

			if (sessionData) {
				sessionData.workspaceData = workspaceData;
				await storeSessionData(sessionId, sessionData);
				console.log(sessionData);
			} else {
				console.error(
					`Error: Delivery ID ${sessionId} not found in room data.`
				);
			}
		});

		socket.on(
			"request-fileContents",
			(sessionId, requestedFilePath, callback) => {
				console.log(
					sessionId +
						" request from " +
						socket.id +
						" for the file: " +
						requestedFilePath
				);
				io.in(sessionId).emit(
					"requestFileContents",
					sessionId,
					socket.id,
					requestedFilePath
				);
			}
		);

		socket.on(
			"response-fileContents",
			(sessionId, responseMessage, callback) => {
				console.log(
					sessionId + " responseMessage " + JSON.stringify(responseMessage)
				);
				io.in(sessionId).emit("responseFileContents", responseMessage);
			}
		);

		socket.on("cursor-updates", (sessionId, cursorData) => {
			console.log(sessionId + " responseMessage " + JSON.stringify(cursorData));
			cursorData["clientId"] = socket.id;
			io.in(sessionId).emit("cursorUpdates", cursorData);
		});

		socket.on("file-updates", (sessionId, fileChanges) => {
			console.log(
				sessionId + " responseMessage " + JSON.stringify(fileChanges)
			);
			fileChanges["clientId"] = socket.id;
			io.in(sessionId).emit("fileContentUpdates", fileChanges);
		});

		socket.on("disconnecting", () => {
			console.log(socket.id, " disconnecting from : ");
			console.log(socket.rooms);

			socket.rooms.forEach(async function (roomId) {
				console.log(socket.id + " disconnecting from " + roomId);
				let sessionData = await retrieveSessionData(roomId);
				console.log(JSON.stringify(sessionData));

				if (sessionData) {
					const existingClientIndex = sessionData.participants.findIndex(
						(item) => item.socketId === socket.id
					);
					if (existingClientIndex !== -1) {
						sessionData.participants.splice(existingClientIndex, 1);
						await storeSessionData(roomId, sessionData);
						console.log(sessionData);
						io.in(roomId).emit("updateParticipants", sessionData.participants);
					}
				}
			});
		});

		socket.on("disconnected", () => {
			console.log(socket.id + " disconnected.");
		});

		socket.on("connect_error", (err) => {
			console.log(`connect_error due to ${err.message}`);
		});
	});
};
