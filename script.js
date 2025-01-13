document.getElementById('convert-button').addEventListener('click', function() {
    const apaInput = document.getElementById('apa-input').value;
    const cslJsonOutput = convertApaToCslJson(apaInput);
    document.getElementById('csl-json-output').value = JSON.stringify(cslJsonOutput, null, 2);
});

function convertApaToCslJson(apaText) {
    const entries = apaText.split('\n\n').map(entry => entry.trim()).filter(entry => entry.length > 0);
    return entries.map(parseApaEntry);
}

function parseApaEntry(entry) {
    const [authorsPart, rest] = splitAuthorsAndRest(entry);
    const authors = parseAuthors(authorsPart);
    const [year, titleAndPublication] = splitYearAndRest(rest);
    const [titlePart, publicationInfo] = splitTitleAndPublicationInfo(titleAndPublication);
    const title = titlePart.trim().replace(/\.$/, '');
    const [journal, volumeIssuePages, doi, isArticle] = parsePublicationInfo(publicationInfo);
    const cslEntry = {
        "type": isArticle ? "article-journal" : "book",
        "title": title,
        "author": authors,
        "issued": {
            "date-parts": [
                [parseInt(year)]
            ]
        }
    };
    if (isArticle) {
        cslEntry["container-title"] = journal.split(',')[0];
        if (volumeIssuePages) {
            cslEntry["volume"] = volumeIssuePages.volume;
            cslEntry["issue"] = volumeIssuePages.issue;
            cslEntry["page"] = volumeIssuePages.pages;
        }
        if (doi) {
            cslEntry["DOI"] = doi;
        }
    } else {
        cslEntry["publisher"] = journal;
    }
    return cslEntry;
}

function splitAuthorsAndRest(entry) {
    const authorEndIndex = entry.indexOf('(');
    return [entry.slice(0, authorEndIndex).trim(), entry.slice(authorEndIndex).trim()];
}

function parseAuthors(authorsPart) {
    return authorsPart.split(', & ').map(author => {
        const [last, first] = author.trim().split(', ');
        return { "family": last, "given": first };
    });
}

function splitYearAndRest(rest) {
    const yearMatch = rest.match(/\((\d{4})\)/);
    const year = yearMatch ? yearMatch[1] : '';
    const restAfterYear = rest.slice(rest.indexOf('). ') + 3).trim();
    return [year, restAfterYear];
}

function splitTitleAndPublicationInfo(restAfterYear) {
    const titleEndIndex = restAfterYear.indexOf('.');
    return [restAfterYear.slice(0, titleEndIndex).trim(), restAfterYear.slice(titleEndIndex + 2).trim()];
}

function parsePublicationInfo(info) {
    const doiIndex = info.indexOf('https://');
    let doi = null;
    if (doiIndex !== -1) {
        doi = info.slice(doiIndex).trim();
        info = info.slice(0, doiIndex).trim();
    }
    const parts = info.split('. ').map(part => part.trim());
    const volumeIssuePages = parseVolumeIssuePages(parts);
    const isArticle = volumeIssuePages !== null;
    const journal = isArticle ? parts[0] : parts.join('. ');
    return [journal, volumeIssuePages, doi, isArticle];
}

function parseVolumeIssuePages(parts) {
    for (const part of parts) {
        const match = part.match(/(\d+)\((\d+)\), (\d+-\d+)/);
        if (match) {
            return {
                volume: match[1],
                issue: match[2],
                pages: match[3]
            };
        }
    }
    return null;
}
