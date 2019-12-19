module.exports = function() {
  return {
    get: function(key) {
      return Buffer.from('');
    },
    set: function(key, value) {
      return value;
    },
  };
};
