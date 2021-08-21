const repoUrl = document.getElementById("repo-url");
const generateBtn = document.getElementById("generate-btn");
const sortBySelect = document.getElementById("sort-by");
const typeSelect = document.getElementById("type");
const outputBox = document.getElementById("output-box");
const renderedBox = document.getElementById("rendered");

let repoOwner = "";
let repoName = "";

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

  // add markdown to ul list with link refs
  const ulElem = document.createElement("ul");
  renderedBox.appendChild(ulElem);

  const liElem = document.createElement("li");
  liElem.appendChild(document.createTextNode("Hello"));
  ulElem.appendChild(liElem);
};

// event listeners
generateBtn.addEventListener("click", async () => {
  const refsJson = await getRefs(repoUrl.value);
  //   console.log(refsJson);
  let gitObjects = createGitObjects(refsJson);
  gitObjects = await getCommitsDates(gitObjects);
  console.log(gitObjects);
  gitObjects.sort(branchSort);
  console.log(gitObjects);
  updateUI(gitObjects);
});
