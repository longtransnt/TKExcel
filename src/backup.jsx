const Backup = () => {
  // if (bankTemp === "GHTK") {
  //   rows.splice(0, 5);
  //   formatDelivery(rows);
  // }
  // const formatDelivery = (transactions) => {
  //   const now = new Date();
  //   const timestamp = now.toLocaleString("vi-VN");
  //   transactions.forEach(function (transaction) {
  //     var delivery = transaction["__EMPTY_1"].split(".");
  //     var customer = transaction["__EMPTY_5"].split("-");
  //     const customer_name = customer[0];
  //     const address = customer[1];
  //     const phone = transaction["__EMPTY_24"];
  //     const money_cod = transaction["__EMPTY_8"];
  //     const delivery_code = delivery[delivery.length - 1];
  //     const phone2 = phone;
  //     const delivery_code2 = delivery_code;
  //     const url = "https://i.ghtk.vn/" + delivery_code;
  //     deliveryList.push({
  //       phone,
  //       customer_name,
  //       delivery_code,
  //       phone2,
  //       money_cod,
  //       address,
  //       delivery_code2,
  //       url,
  //     });
  //   });
  //   const worksheet = XLSX.utils.json_to_sheet(deliveryList);
  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, "GHTK");
  //   XLSX.writeFile(workbook, "GHTK_Ship_" + timestamp + ".xlsx");
  // };
};
