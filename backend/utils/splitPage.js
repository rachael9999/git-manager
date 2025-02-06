function splitPage(data, itemsPerPage = 10) {
    const pages = [];
    for (let i = 0; i < data.length; i += itemsPerPage) {
      pages.push(data.slice(i, i + itemsPerPage));
    }
    return pages;
  }
  
  module.exports = { splitPage };