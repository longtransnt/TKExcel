import { useState } from "react";
import { read, utils } from "xlsx";
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
  const [bankFormat, setBankFormat] = useState("");
  const [transacType, setTransacType] = useState("");
  const [currentFile, setCurrentFile] = useState(null);

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
      if (bankFormat === "VCB") {
        if (+transaction["__EMPTY_1"]) {
          // Get date from __EMPTY_2 string
          const day_array = transaction["__EMPTY_2"].split("\n");
          const partial_array = day_array[0].split("/");
          const ddmmyyyy_date =
            partial_array[1] + "/" + partial_array[0] + "/" + partial_array[2];

          // Convert timezone before compare
          const timestamp = new Date(ddmmyyyy_date).getTime() + 7 * 3600000;
          // Only count transactions within specified timezone
          if (date1 !== "" && ddmmyyyy_date !== undefined) {
            if (timestamp_start <= timestamp && timestamp <= timestamp_end) {
              value = transaction["SAO KÊ TÀI KHOẢN\nSTATEMENT OF ACCOUNT"];
              real = parseFloat(value.replace(/,/g, ""));

              if (value === "") {
                value = transaction["__EMPTY_3"];
                real = -1 * parseFloat(value.replace(/,/g, ""));
              }

              expenseList.push({
                id: transaction["__EMPTY_1"],
                date: day_array[0],
                content: transaction["__EMPTY_5"],
                value: value,
                real_value: real,
              });

              if (real > 0) {
                incomeList.push({
                  id: transaction["__EMPTY_1"],
                  date: day_array[0],
                  content: transaction["__EMPTY_5"],
                  value: value,
                  real_value: real,
                });
              }
            }
          }
        }
      } else if (bankFormat === "SCB") {
        // Get current transaction date
        let date_string = transaction["__EMPTY_4"].split(" ");
        let partial_array = date_string[0].split("-");
        const ddmmyyyy_date =
          partial_array[1] + "/" + partial_array[0] + "/" + partial_array[2];
        // Convert timezone before compare
        const timestamp = new Date(ddmmyyyy_date).getTime() + 7 * 3600000;
        if (date1 !== "" && ddmmyyyy_date !== undefined) {
          if (timestamp_start <= timestamp && timestamp <= timestamp_end) {
            // Get value and real value
            value = transaction["__EMPTY_18"] + "";
            real = parseFloat(value.replaceAll(".", ""));
            // If real value is error, check the negative error
            if (value === "undefined") {
              value = transaction["__EMPTY_16"] + "";
              real = -1 * parseFloat(value.replaceAll(".", ""));
            }
            let date_string2 = date_string[0].replaceAll("-", "/");

            // Push data in data frame
            expenseList.push({
              id: transaction["__EMPTY_1"],
              date: date_string2,
              content: transaction["__EMPTY_12"],
              value: value,
              real_value: real,
            });

            if (real > 0) {
              // Push data export if real value is larger than 0
              incomeList.push({
                id: transaction["__EMPTY_1"],
                date: date_string2,
                content: transaction["__EMPTY_12"],
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

  const handleImport = () => {
    if (currentFile.length) {
      const file = currentFile[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const wb = read(event.target.result);
        const sheets = wb.SheetNames;

        if (sheets.length) {
          const rows = utils.sheet_to_json(wb.Sheets[sheets[0]]);
          if (bankFormat === "VCB") {
            rows.splice(0, 10);
          } else if (bankFormat === "VTB") {
            rows.splice(0, 3);
          } else if (bankFormat === "SCB") {
            rows.splice(0, 22);
          }
          formatTransaction(rows);
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

  return (
    <>
      <Container fluid>
        <Row>
          <Col md="3">
            <label>Chọn format xlsx từ ngân hàng:</label>
            <Form.Control
              as="select"
              value={bankFormat}
              onChange={(e) => {
                setBankFormat(e.target.value);
              }}
            >
              <option defaultValue=""></option>
              <option value="VCB">Vietcombank</option>
              <option value="SCB">Sacombank</option>
              {/* <option value="VTB">Vietinbank</option> */}
            </Form.Control>
            <br />
          </Col>
          <Col className="pr-1" md="2">
            <label>Ngày Đầu</label>
            <Form.Control
              type="date"
              onChange={(e) => {
                setDate1(e.target.value);
              }}
              value={date1}
            />
          </Col>
          <Col className="pr-1" md="2">
            <label>Ngày Cuối</label>
            <Form.Control
              type="date"
              onChange={(e) => {
                setDate2(e.target.value);
              }}
              value={date2}
            />
          </Col>
          <Col className="pr-1" md="3">
            <label>Tìm Theo Nội Dung</label>
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
              {/* <option value="VTB">Vietinbank</option> */}
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
            <div>Tổng Số Tiền Thu Được:</div>
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
            <div>Tổng Số Tiền Chi Ra:</div>
            <span
              style={{
                color: "red",
                fontWeight: "bold",
              }}
            >
              {Number(expense).toLocaleString("vi-VN")} VND
            </span>
          </Col>
          <Col className="pr-1" md="3">
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
                <thead>
                  <tr>
                    <th scope="col">STT</th>
                    <th scope="col">Ngày</th>
                    <th scope="col">Thông Tin</th>
                    <th scope="col">Số Tiền</th>
                  </tr>
                </thead>
                <FilteredList
                  data={data}
                  input={searchTxt}
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
