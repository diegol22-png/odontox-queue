function initSocket(io) {
  io.on('connection', (socket) => {
    socket.on('join:patient', (queueId) => {
      socket.join(`patient:${queueId}`);
    });

    socket.on('join:exam', (examTypeId) => {
      socket.join(`exam:${examTypeId}`);
    });

    socket.on('join:panel', () => {
      socket.join('panel');
    });
  });
}

module.exports = { initSocket };
