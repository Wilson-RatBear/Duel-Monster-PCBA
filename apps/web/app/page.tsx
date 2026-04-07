"use client";

import { useEffect } from "react";

export default function Home() {
	useEffect(() => {
		fetch("http://localhost:3000")
			.then((res) => res.json())
			.then((data) => {
				console.log(data);
			});
	});

	return (
		<div>
			<h2>Hello world</h2>
		</div>
	);
}
