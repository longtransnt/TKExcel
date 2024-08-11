import { useState } from "react";
import { read, utils } from "xlsx";
import * as XLSX from "xlsx";
import { Form, Container, Row, Col } from "react-bootstrap";
import FilteredList from "./FilteredList";

const IncomeView = () => {
  // Parameters to display data to frontend
  const [data, setData] = useState([]);
  const [date1, setDate1] = useState("");
  const [date2, setDate2] = useState("");
  const [searchTxt, setSearchTxt] = useState("");
  const [add, setAdd] = useState(0);
  const [expense, setExpense] = useState(0);
  const [bankTemp, setBankFormat] = useState("");
  const [transacType, setTransacType] = useState("");
  const [currentFile, setCurrentFile] = useState(null);
  // const [deliveryList, setDeliveryList] = useState([]);

  // Function to handle transactions data from xlsx file
  const formatTransaction = (transactions) => {
    let expenseList = [];
    let incomeList = [];
    let income = 0;
    let expense = 0;

    const timestamp_start = new Date(date1).getTime();
    if (date2 === "") setDate2(date1);
    const timestamp_end = new Date(date2).getTime();

    transactions.forEach(function (transaction) {
      let value = "";
      let real = 0;
      if (bankTemp === "VCB") {
        //     null,
        //     "STT\nNo.",
        //     "Ngày/\nTNX Date/ Số CT/ Doc No",
        //     "Số tiền ghi nợ/\nDebit",
        //     "Số tiền ghi có/\nCredit",
        //     "Số dư/\nBalance",
        //     "Nội dung chi tiết/\nTransactions in detail"
        if (+transaction[1]) {
          const day_array = transaction[2].split("\n");
          const partial_array = day_array[0].split("/");

          const ddmmyyyy_date =
            partial_array[1] + "/" + partial_array[0] + "/" + partial_array[2];

          // Convert timezone before compare
          const timestamp = new Date(ddmmyyyy_date).getTime() + 7 * 3600000;
          // Only count transactions within specified timezone
          if (date1 !== "" && ddmmyyyy_date !== undefined) {
            if (timestamp_start <= timestamp && timestamp <= timestamp_end) {
              value = transaction[4];
              real = parseFloat(value.replace(/,/g, ""));

              if (value === "") {
                value = transaction[3];
                real = -1 * parseFloat(value.replace(/,/g, ""));
              }

              expenseList.push({
                id: transaction[1],
                date: day_array[0],
                content: transaction[6],
                value: value,
                real_value: real,
              });

              if (real > 0) {
                incomeList.push({
                  id: transaction[1],
                  date: day_array[0],
                  content: transaction[6],
                  value: value,
                  real_value: real,
                });
              }
            }
          }
        }
      } else if (bankTemp === "SCB") {
        // Get current transaction date
        let date_string = transaction[4].split(" ");
        let partial_array = date_string[0].split("-");
        const ddmmyyyy_date =
          partial_array[1] + "/" + partial_array[0] + "/" + partial_array[2];
        // Convert timezone before compare
        const timestamp = new Date(ddmmyyyy_date).getTime() + 7 * 3600000;
        if (date1 !== "" && ddmmyyyy_date !== undefined) {
          if (timestamp_start <= timestamp && timestamp <= timestamp_end) {
            // Get value and real value
            value = transaction[18] + "";
            real = parseFloat(value.replaceAll(".", ""));
            // If real value is error, check the negative error
            if (value === "undefined") {
              value = transaction[16] + "";
              real = -1 * parseFloat(value.replaceAll(".", ""));
            }
            let date_string2 = date_string[0].replaceAll("-", "/");

            // Push data in data frame
            expenseList.push({
              id: transaction[2],
              date: date_string2,
              content: transaction[12],
              value: value,
              real_value: real,
            });

            if (real > 0) {
              // Push data export if real value is larger than 0
              incomeList.push({
                id: transaction[2],
                date: date_string2,
                content: transaction[12],
                value: value,
                real_value: real,
              });
            }
          }
        }
      } else if (bankTemp === "TCB") {
        /*
        0: "NGAY"
        1: "DIEN GIAI"
        2: "CHI TIET"
        3: "NO"
        4: "CO"
        5: "SO DU"
        */
        // Get current transaction date
        let date_string = transaction[0].split(" ");
        let partial_array = date_string[0].split("/");
        const ddmmyyyy_date =
          partial_array[1] + "/" + partial_array[0] + "/" + partial_array[2];
        // Convert timezone before compare
        const timestamp = new Date(ddmmyyyy_date).getTime() + 7 * 3600000;
        if (date1 !== "" && ddmmyyyy_date !== undefined) {
          if (timestamp_start <= timestamp && timestamp <= timestamp_end) {
            // Get value and real value
            value = transaction[4] + "";
            real = parseFloat(value.replaceAll(",", ""));
            // If real value is error, check the negative error
            if (value === "undefined") {
              value = transaction[3] + "";
              real = -1 * parseFloat(value.replaceAll(".", ""));
            }
            let date_string2 = date_string[0].replaceAll("-", "/");

            // Push data in data frame
            expenseList.push({
              id: transaction[2],
              date: date_string2,
              content: transaction[1],
              value: value,
              real_value: real,
            });

            if (real > 0) {
              // Push data export if real value is larger than 0
              incomeList.push({
                id: transaction[2],
                date: date_string2,
                content: transaction[1],
                value: value,
                real_value: real,
              });
            }
          }
        }
      }
      // Count total gain money and output to UI
      if (value !== undefined) {
        if (real > 0) income += real;
        else expense += real;
      }
    });
    incomeList.push({
      value: "Tổng Tiền",
      real_value: income,
    });
    setData(expenseList);
    setAdd(income);
    setExpense(expense);
  };

  const handleFileChange = ($event) => {
    setCurrentFile($event.target.files);
  };

  const deleteRows = (rowsToDelete) => {
    const newData = data.filter((_, index) => !rowsToDelete.includes(index));
    setData(newData);
  };

  const handleImport = () => {
    if (currentFile.length) {
      const file = currentFile[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const wb = read(event.target.result);
        const sheets = wb.SheetNames;

        if (sheets.length) {
          const rows = utils.sheet_to_json(wb.Sheets[sheets[0]], {
            header: 1,
          });
          // Vietcombank
          if (bankTemp === "VCB") {
            rows.splice(0, 12);
            // Sacombank
          } else if (bankTemp === "SCB") {
            rows.splice(0, 24);
            // Techcombank
          } else if (bankTemp === "TCB") {
            rows.splice(0, 8);
            // Techcombank
          }
          formatTransaction(rows);

          // if (bankTemp === "GHTK") {
          //   rows.splice(0, 5);
          //   formatDelivery(rows);
          // }
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const updateAdd = (newAdd) => {
    setAdd(newAdd);
  };

  const updateExpense = (newExp) => {
    setExpense(newExp);
  };

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

  return (
    <>
      <Container fluid>
        <Row>
          <Col md="3">
            <label>Chọn format xlsx từ ngân hàng:</label>
            <Form.Control
              as="select"
              value={bankTemp}
              onChange={(e) => {
                setBankFormat(e.target.value);
              }}
            >
              <option defaultValue=""></option>
              <option value="VCB">Vietcombank</option>
              <option value="SCB">Sacombank</option>
              <option value="TCB">Techcombank</option>
              <option value="ACB">ACB</option>
              {/* <option value="GHTK">GiaoHangTietKiem</option> */}
            </Form.Control>
            <br />
          </Col>
          <Col className="pr-1" md="2">
            <label>Ngày đầu</label>
            <Form.Control
              type="date"
              onChange={(e) => {
                setDate1(e.target.value);
              }}
              value={date1}
            />
          </Col>
          <Col className="pr-1" md="2">
            <label>Ngày cuối</label>
            <Form.Control
              type="date"
              onChange={(e) => {
                setDate2(e.target.value);
              }}
              value={date2}
            />
          </Col>
          <Col className="pr-1" md="3">
            <label>Tìm theo nội dung</label>
            <Form.Control
              type="text"
              onChange={(e) => {
                var lowerCase = e.target.value.toLowerCase();
                setSearchTxt(lowerCase);
              }}
              value={searchTxt}
            />
          </Col>
          <Col md="2">
            <label>Loại giao dịch</label>
            <Form.Control
              as="select"
              value={transacType}
              onChange={(e) => {
                setTransacType(e.target.value);
              }}
            >
              <option defaultValue=""></option>
              <option value="Add">Tiền vào</option>
              <option value="Exp">Tiền ra</option>
            </Form.Control>
            <br />
          </Col>
        </Row>
        <Row>
          <Col className="pr-1" md="3">
            <div className="input-group">
              <div className="custom-file">
                <input
                  type="file"
                  name="file"
                  className="custom-file-input"
                  id="inputGroupFile"
                  required
                  onChange={handleFileChange}
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                />
              </div>
            </div>
          </Col>

          <Col className="pr-1" md="3">
            <div>Tổng số tiền thu được:</div>
            <span
              style={{
                color: "green",
                fontWeight: "bold",
              }}
            >
              {Number(add).toLocaleString("vi-VN")} VND
            </span>
          </Col>
          <Col className="pr-1" md="3">
            <div>Tổng số tiền chi ra:</div>
            <span
              style={{
                color: "red",
                fontWeight: "bold",
              }}
            >
              {Number(expense).toLocaleString("vi-VN")} VND
            </span>
          </Col>

          <Col className="" md="3">
            <span>
              <button
                onClick={handleImport}
                className="btn btn-primary float-right"
              >
                Tải lại <i className="fa fa-refresh"></i>
              </button>
            </span>
          </Col>
        </Row>
        <Row>
          <div className="row">
            <div className="col-sm-12 ">
              <table className="table">
                <FilteredList
                  data={data}
                  input={searchTxt}
                  bankTemp={bankTemp}
                  updateExpense={updateExpense}
                  updateAdd={updateAdd}
                  type={transacType}
                />
              </table>
            </div>
          </div>
        </Row>
      </Container>
    </>
  );
};

export default IncomeView;
