module.exports = function() {
  return {
    random: 1,
    getBuffer: async function(key) {
      return Buffer.from('');
    },
    set: async function(key, value, type, ttl) {
      return value;
    },
  };
};
