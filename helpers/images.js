export function is16x9(img) {
	return (img.width / img.height).toFixed(2) == 1.78;
}

export function verifyImage(file, isValid, errorMessage) {
	return new Promise((resolve, reject) => {
		// start reader
		const reader = new FileReader();
		reader.onload = (e) => {
			const image = new Image();
			image.src = e.target.result;
			image.onload = function () {
				// do not use arrow fn
				const isValidImage = isValid(this); // this is image now
				if (isValidImage) resolve();
				else reject(new Error(errorMessage));
			};
			image.onerror = () => reject(e);
		};
		reader.onerror = () => reject();

		// set file to be read
		reader.readAsDataURL(file);
	});
}
