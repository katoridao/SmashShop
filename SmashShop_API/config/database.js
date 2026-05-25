const mongoose = require("mongoose");

const mongoURL = "mongodb://dha:6lxtKJ44sodNiKM2@ac-41ziyf0-shard-00-00.zzooqos.mongodb.net:27017,ac-41ziyf0-shard-00-01.zzooqos.mongodb.net:27017,ac-41ziyf0-shard-00-02.zzooqos.mongodb.net:27017/?ssl=true&replicaSet=atlas-odz7a1-shard-0&authSource=admin&appName=Cluster0";

// connect mongodb
const connect = async () => {
  try {
    if (!mongoURL) {
      throw new Error("Thiếu biến môi trường MONGO_URL");
    }

    await mongoose.connect(mongoURL);
    console.log("kết nối mongodb thành công");
  } catch (error) {
    console.log("kết nối thất bại: " + error.message);
    throw error;
  }
};
module.exports = { connect };
