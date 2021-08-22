const repoUrl = document.getElementById("repo-url");
const generateBtn = document.getElementById("generate-btn");
const sortBySelect = document.getElementById("sort-by");
const typeSelect = document.getElementById("type");
const outputBox = document.getElementById("output-box");
const renderedBox = document.getElementById("rendered");

let repoOwner = "";
let repoName = "";
let url = "";

const getRefs = async (url) => {
  const splitUrl = url.split("/");
  repoOwner = splitUrl[3];
  repoName = splitUrl[4];
  const refsUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/git/refs`;

  try {
    const refs = await fetch(refsUrl);
    const refsJson = await refs.json();
    return refsJson;
  } catch (error) {
    console.error("No branches or tags found!");
  }
};

const createGitObjects = (jsonData) => {
  let gitObjects = jsonData.map((obj) => {
    const refName = obj.ref;
    const splitRefName = refName.split("/");
    const branchName = splitRefName[splitRefName.length - 1];
    const sha = obj.object.sha;
    const type = obj.object.type;
    return {
      branchName: branchName,
      sha: sha,
      type: type,
    };
  });
  return gitObjects;
};

const getCommitsDates = async (gitObjects) => {
  let newGitObjects = [...gitObjects];
  newGitObjects = newGitObjects.map(async (obj) => {
    let url = "";
    if (obj.type === "commit") {
      url = `https://api.github.com/repos/${repoOwner}/${repoName}/git/commits/${obj.sha}`;
    } else {
      url = `https://api.github.com/repos/${repoOwner}/${repoName}/git/tags/${obj.sha}`;
    }

    let response = await fetch(url);
    let json = await response.json();

    if (obj.type === "commit") {
      date = json.author.date;
    } else {
      date = json.tagger.date;
    }
    obj.date = new Date(date);
    return obj;
  });

  return Promise.all(newGitObjects);
};

const branchSort = (a, b) => {
  return a.date - b.date;
};

const updateUI = (gitObjects) => {
  let outputStr = "";
  for (let i = 0; i < gitObjects.length; i++) {
    outputStr += `- [${gitObjects[i].branchName}](https://github.com/${repoOwner}/${repoName}/tree/${gitObjects[i].branchName})\n`;
  }
  outputBox.value = outputStr;

  renderMarkdown(gitObjects);
  repoUrl.value = url;
};

const renderMarkdown = (gitObjects) => {
  // check if there's an existing ul
  const existingUl = document.getElementById("markdown-ul");
  if (existingUl) {
    existingUl.remove();
  }

  // add markdown to ul list with link refs
  const ulElem = document.createElement("ul");
  ulElem.setAttribute("id", "markdown-ul");
  renderedBox.appendChild(ulElem);

  // output to ul > li
  for (let i = 0; i < gitObjects.length; i++) {
    const liElem = document.createElement("li");
    const aRef = document.createElement("a");
    aRef.href = `https://github.com/${repoOwner}/${repoName}/tree/${gitObjects[i].branchName}`;
    aRef.innerText = `${gitObjects[i].branchName}`;
    liElem.appendChild(aRef);
    ulElem.appendChild(liElem);
  }
};

const updateLocalStorage = (repoName, repoOwner, gitObjects) => {
  const gitPack = {
    repoUrl: url,
    repoOwner: repoOwner,
    repoName: repoName,
    gitObjects: gitObjects,
  };
  localStorage.setItem("repoData", JSON.stringify(gitPack));
};

// event listeners
generateBtn.addEventListener("click", async () => {
  const refsJson = await getRefs(repoUrl.value);
  url = repoUrl.value;
  //   console.log(refsJson);
  let gitObjects = createGitObjects(refsJson);
  gitObjects = await getCommitsDates(gitObjects);
  //   console.log(gitObjects);
  gitObjects.sort(branchSort);
  //   console.log(gitObjects);
  updateUI(gitObjects);
  updateLocalStorage(repoName, repoOwner, gitObjects);
});

// update ui if there's data in localStorage
const repoData = JSON.parse(localStorage.getItem("repoData"));
if (repoData) {
  url = repoData.repoUrl;
  repoOwner = repoData.repoOwner;
  repoName = repoData.repoName;
  updateUI(repoData.gitObjects);
}
