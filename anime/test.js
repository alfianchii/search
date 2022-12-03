const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Here we define our query as a multi-line string
// Storing it in a separate .graphql/.gql file is also possible
const query = `
query ($search: String $page: Int, $perPage: Int, $id: Int) { # Define which variables will be used in the query (id)
	Page (page: $page, perPage: $perPage) {
		pageInfo {
		  total
		  currentPage
		  lastPage
		  hasNextPage
		  perPage
		}
		
		media (id: $id, search: $search, type: ANIME) { # Insert our variables into the query arguments (id) (type: ANIME is hard-coded in the query)
			id
			title {
			  romaji
			  english
			  native
			}
			type 
			description
			startDate {
				year
				month
				day
			}
			duration
			episodes
			chapters
			status
			bannerImage
			genres
			synonyms
			averageScore
			bannerImage
			coverImage {
				extraLarge
				large
				medium
				color
			}
			tags {
				name
				description
				category
				rank
			}
			studios {
				nodes {
					name
					siteUrl
				}
			}
			externalLinks {
				url
				site
			}
			format
			source
		}
	}
}
`;

// Define our query variables and values that will be used in the query request
let searchBtn = document.getElementById("input-keyword");
let animeList = document.getElementById("anime-list");
let headerContent = document.querySelector("#header-content");
let paginationBtn = document.querySelector(".pagination");

document.getElementById("search-button").addEventListener("click", async function () {
	getAndShowAnime(1, 6);
});

function showPagination(totalData = 1, perPage, currentPage) {
	currentPage = parseInt(currentPage);
	paginationBtn.innerHTML = "";
	let pagination = Math.floor(totalData / perPage);
	let paginationContent = `
		<li class="page-item">
			<a class="page-link" href="#" tabindex="-1" aria-disabled="true">Prev</a>
		</li>`;

	for (let i = 1; i <= pagination; i++) {
		paginationContent += `
			<li class="page-item"><a class="page-link ${currentPage === i ? "active" : ""}" href="#">${i}</a></li>
		`;
	}

	paginationContent += `
		<li class="page-item">
			<a class="page-link" href="#">Next</a>
		</li>
	`;

	paginationBtn.innerHTML = paginationContent;
}

document.addEventListener("click", function (e) {
	if (e.target.classList.contains("page-link")) {
		const childrens = paginationBtn.children;
		let currentPage = e.target; // e.target.innerHTML
		const allBtn = document.querySelectorAll(".page-link");
		if (currentPage.textContent !== "Prev" && currentPage.textContent !== "Next") {
			// Remove active
			for (const child of childrens) {
				child.firstElementChild.classList.remove("active");
			}
			currentPage.classList.add("active");
			return getAndShowAnime(currentPage.innerHTML, 6);
		} else if (currentPage.textContent === "Next") {
			for (const btn of allBtn) {
				if (btn.classList.contains("active")) {
					let lastElement = btn.parentElement.parentElement.lastElementChild.previousElementSibling.firstChild.innerHTML;

					if (btn.innerHTML === lastElement) {
						return;
					}

					btn.classList.remove("active");
					btn.parentElement.nextElementSibling.firstElementChild.classList.add("active");
					currentPage = parseInt(btn.textContent) + 1;
					return getAndShowAnime(currentPage, 6);
				}
			}
		} else if (currentPage.textContent === "Prev") {
			for (const btn of allBtn) {
				if (btn.classList.contains("active")) {
					let firstElement = btn.parentElement.parentElement.firstElementChild.nextElementSibling.firstChild.innerHTML;

					if (btn.innerHTML === firstElement) {
						return;
					}

					btn.classList.remove("active");
					btn.parentElement.previousElementSibling.firstElementChild.classList.add("active");
					currentPage = parseInt(btn.textContent) - 1;
					return getAndShowAnime(currentPage, 6);
				}
			}
		}
	}
});

async function getAndShowAnime(currentPg = 1, perPage = 6) {
	try {
		const data = await getAnime(searchBtn.value, currentPg);

		const totalData = data.media.length;
		const pageNumbers = Math.floor(totalData / perPage);

		let animes = [];
		for (let i = 0; i < pageNumbers; i++) {
			animes.push(data.media.splice(i, perPage));
		}

		showAnime(animes, currentPg);
		showPagination(totalData, perPage, currentPg);
	} catch (error) {
		console.log(error);
	}
}

// Get the anime's data
async function getAnime(keyword) {
	// Define the config we'll need for our Api request
	return await fetch(`https://graphql.anilist.co`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify({
			query: query,
			variables: {
				search: keyword,
				// page: currentPage, // currentPage = 1
				// perPage: page, // page = 6
			},
		}),
	})
		// Make the HTTP Api request
		.then((response) => {
			if (!response.ok) {
				throw new Error(response.statusText);
			}
			return response.json();
		})
		.then((response) => {
			return response.data.Page;
		});
}

function showAnime(obj, currentPage) {
	currentPage--;

	headerContent.innerHTML = `
		<h4 class="mb-5 text-center">Search result of '${searchBtn.value}' :</h4>`;

	let content = "";

	obj = obj[currentPage];

	obj.forEach(
		({
			title,
			coverImage,
			bannerImage,
			startDate,
			id,
			studios: {
				nodes: [studio1],
			},
			duration,
			episodes,
			status,
			genres,
			synonyms,
			averageScore,
			tags,
			description,
			externalLinks,
			format,
			source,
		}) => {
			// Take the anime id
			const animeId = id;

			// Validate language title and set it to romaji if it's not available in english. If it's not available in romaji, set it to native.
			const [englishTitle, romajiTitle, nativeTitle] = validateTitles(title);

			// Validate if the anime have no a cover image
			const cover = validateCoverImages(coverImage);

			// Validate description if null/undefined and remove the source
			const desc = validateDescriptions(description);

			// Validate released date if null/undefined
			const [day, month, year] = validateDateFormat(startDate);

			// Validate format if null/undefined
			const type = validateNoUnderscore(format);

			// Validate genres if null/undefined
			const genre = validateGenres(genres);

			// Validate studio if null/undefined
			const studioProducer = validateStudioProducer(studio1);

			// Validate status if null/undefined and seperate it to 2 words (no underscore)
			const stat = validateNoUnderscore(status);

			// Validate episodes if null/undefined
			const episode = validate(episodes);

			// Validate duration if null/undefined
			const time = validate(duration);

			// Validate the links that just Official Site, Youtube, Blibli, and Netflix
			const externalLink = validateSiteLinks(externalLinks);

			// Validate synonyms if null/undefined
			const synonym = validateSynonyms(synonyms);

			// Validate tags if null/undefined
			const tag = validateTags(tags);

			// Validate adaptation if null/undefined and seperate it to 2 words (no underscore)
			const adaptation = validateNoUnderscore(source);

			// Validate score if null/undefined
			const average = validate(averageScore);

			content += `
				<div class="col-12 col-lg-4 col-md-6 mb-5">
					<div class="card">
						<div class="card-body">
							<h4 class="card-title mb-4">${englishTitle !== "NO 'EN' TITLE" ? englishTitle : romajiTitle ? romajiTitle : nativeTitle}</h4>
							<img src="${cover}" alt="${englishTitle !== "NO 'EN' TITLE" ? englishTitle : romajiTitle ? romajiTitle : nativeTitle}" class="rounded img-fluid w-100">
							<h5 class="font-extrabold my-3">${year}</h5>
							<div class="modal-primary me-1 mb-1 d-inline-block">
								<!-- Button trigger for primary themes modal -->
								<button type="button" class="btn btn-primary" data-bs-toggle="modal"
									data-bs-target="#anime${animeId}">
									Detail
								</button>
								<!--primary theme Modal -->
								<div class="modal fade text-left" id="anime${animeId}" tabindex="-1" role="dialog"
									aria-labelledby="myModalLabel160" aria-hidden="true">
									<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl"
										role="document">
										<div class="modal-content">
											<div class="modal-header bg-primary">
												<div class="d-xl-flex justify-content-xl-around w-100 text-center">
													<div>
														<h5 class="modal-title white" id="myModalLabel160">${englishTitle}</h5>
													</div>
													<div>
														<h5 class="modal-title white">${romajiTitle}</h5>
													</div>
													<div>
														<h5 class="modal-title white">${nativeTitle}</h5>
													</div>
												</div>

												<!-- <button type="button" class="close" data-bs-dismiss="modal"
													aria-label="Close">
													<i data-feather="x"></i>
												</button> -->
											</div>
											<div class="modal-body">
												<div class="row">
													<div class="col-12 col-xl-5 mb-3">
														<img class="rounded img-fluid mx-auto d-block" src="${cover}" alt="${englishTitle}" />
													</div>
													<div class="col-12 col-xl-7">
														<ul class="list-group w-100">
															<li class="list-group-item"><span class="font-extrabold">Synonym:</span> ${synonym}</li>
															<li class="list-group-item"><span class="font-extrabold">Description:</span> ${desc}</li>
															<li class="list-group-item"><span class="font-extrabold">Released:</span> ${day} ${month} ${year}</li>
															<li class="list-group-item"><span class="font-extrabold">Studio:</span> ${studioProducer}</li>
															<li class="list-group-item"><span class="font-extrabold">Type:</span> ${type}</li>
															<li class="list-group-item"><span class="font-extrabold">Adaptation:</span> ${adaptation}</li>
															<li class="list-group-item"><span class="font-extrabold">Status:</span> ${stat}</li>
															<li class="list-group-item"><span class="font-extrabold">Genre:</span> ${genre}</li>
															<li class="list-group-item"><span class="font-extrabold">Episode:</span> ${episode} episode(s)</li>
															<li class="list-group-item"><span class="font-extrabold">Duration:</span> ${time} minute(s)</li>
															<li class="list-group-item"><span class="font-extrabold me-1">Tag:</span> ${tag}</li>
															<li class="list-group-item"><span class="font-extrabold me-1">Average Score:</span> ${average}</li>
															<li class="list-group-item"><span class="font-extrabold me-1">Site:</span> ${externalLink}</li>
														</ul>
													</div>
												</div>
											</div>

											<div class="modal-footer">
												<button type="button" class="btn btn-outline-light"
													data-bs-dismiss="modal">
													<span class="d-sm-block">Close</span>
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>`;
		},
	);

	animeList.innerHTML = content;
}

/*
Utilities function
*/
function isUrlUnknown(url) {
	return url === "#" ? "disabled" : "";
}

// Take links that just Official Site, Youtube, Blibli, and Netflix
function validateSiteLinks(links) {
	// Just Official Site, Youtube, Blibli, and Netflix
	let newLinks = links.reduce((acc, link) => {
		if (link.site === "Official Site" || link.site === "Youtube" || link.site === "Bilibili TV" || link.site === "Netflix") {
			acc.push(link);
		}
		return acc;
	}, []);

	// Validate if there is no link
	newLinks = newLinks.length > 0 ? newLinks : [{ site: "unknown", url: "#" }];

	// Concatenate all links
	return (links = newLinks
		.map(({ site, url }) => {
			return `<a href="${url}" target="_blank" class="btn btn-sm btn-primary me-2 d-inline-block ${isUrlUnknown(url)}">${site}</a>`;
		})
		.join(""));
}

function validateDateFormat({ day, month, year }) {
	day = day ?? "";

	month = months[month - 1] ?? "";

	year = year ?? "";

	return [day, month, year];
}

function validateDescriptions(desc) {
	const noBR = desc ? desc.replace("<br>", "").replace("<br><br>", "<br>").replace("(", "[").replace(")", "]") : "unknown";
	return noBR;
}

function validateCoverImages({ extraLarge, large, medium, color }) {
	return extraLarge ?? large ?? medium ?? color ?? "https://via.placeholder.com/300x450.png?text=No+Image";
}

function validateTitles({ english, romaji, native }) {
	english = english ?? "NO 'EN' TITLE";
	romaji = romaji ?? "NO 'ROMAJI' TITLE";
	native = native ?? "NO 'JP' TITLE";
	return [english, romaji, native];
}

function validateGenres(genres) {
	return genres ? genres.join(", ") : "unknown";
}

function validateStudioProducer(studioProducer) {
	return studioProducer?.name ?? "unknown";
}

function validateNoUnderscore(data) {
	return data ? data.split("_").join(" ") : "unknown";
}

function validateSynonyms(synonyms) {
	return synonyms ? synonyms.map((synonym) => synonym).join(`<span class="font-extrabold"> || </span>`) : "unknown";
}

function validate(data) {
	return data ?? "unknown";
}

function validateTags(tags) {
	return tags ? tags.map((tag) => tag.name).join(", ") : "unknown";
}
