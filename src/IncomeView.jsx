import { useState } from "react";
import { read, utils } from "xlsx";
import { Form, Container, Row, Col } from "react-bootstrap";
import FilteredList from "./FilteredList";

const IncomeView = () => {
  const [data, setData] = useState([]);
  const [date1, setDate1] = useState("");
  const [date2, setDate2] = useState("");
  const [searchTxt, setSearchTxt] = useState("");
  const [add, setAdd] = useState(0);
  const [expense, setExpense] = useState(0);
  const [bankTemp, setBankFormat] = useState("");
  const [transacType, setTransacType] = useState("");
  const [currentFile, setCurrentFile] = useState(null);

  // Helper to format values consistently
  const formatValue = (num) => Number(num).toLocaleString("en-US");

  // Bank-specific parsers using formatValue for all banks
  const bankParsers = {
    VCB: (transaction) => {
      if (!+transaction[1]) return null;
      const rawDate = transaction[2].split("\n")[0];
      const parts = rawDate.split("/");
      const dateForFilter = `${parts[1]}/${parts[0]}/${parts[2]}`;
      let value = transaction[4];
      let real = parseFloat(value.replace(/,/g, ""));
      if (value === "") {
        value = transaction[3];
        real = -1 * parseFloat(value.replace(/,/g, ""));
      }
      return {
        id: transaction[1],
        date: rawDate,
        dateForFilter,
        content: transaction[6],
        value: formatValue(real),
        real_value: real,
      };
    },
    TCB: (transaction) => {
      const datePart = transaction[0].split(" ")[0];
      const parts = datePart.split("/");
      const dateForFilter = `${parts[1]}/${parts[0]}/${parts[2]}`;
      let value = transaction[4] + "";
      let real = parseFloat(value.replaceAll(",", ""));
      if (value === "") {
        value = transaction[3] + "";
        real = -1 * parseFloat(value.replaceAll(",", ""));
      }
      return {
        id: transaction[2],
        date: datePart.replaceAll("-", "/"),
        dateForFilter,
        content: transaction[1],
        value: formatValue(real),
        real_value: real,
      };
    },
    ACB: (transaction) => {
      const datePart = transaction[1].split(" ")[0];
      const parts = datePart.split("/");
      const dateForFilter = `${parts[1]}/${parts[0]}/${parts[2]}`;
      let value = transaction[6] + "";
      let real = parseFloat(value.replaceAll(".", ""));
      if (value === "") {
        value = transaction[5] + "";
        real = -1 * parseFloat(value.replaceAll(".", ""));
      }
      return {
        id: transaction[0].index,
        date: `${parts[0]}/${parts[1]}/${parts[2]}`,
        dateForFilter,
        content: transaction[3],
        value: formatValue(real),
        real_value: real,
      };
    },
    VTB: (transaction) => {
      const datePart = transaction[1].split(" ")[0];
      const parts = datePart.split("-");
      const dateForFilter = `${parts[1]}/${parts[0]}/${parts[2]}`;
      let value = transaction[4] + "";
      let real = parseFloat(value.replaceAll(".", ""));
      if (value === "0") {
        value = transaction[3] + "";
        real = -1 * parseFloat(value.replaceAll(".", ""));
      }
      return {
        id: transaction[0].index,
        date: `${parts[0]}/${parts[1]}/${parts[2]}`,
        dateForFilter,
        content: transaction[2],
        value: formatValue(real),
        real_value: real,
      };
    },
  };

  const formatTransaction = (transactions) => {
    let expenseList = [];
    let incomeList = [];
    let income = 0;
    let expense = 0;

    const timestamp_start = new Date(date1).getTime();
    if (date2 === "") setDate2(date1);
    const timestamp_end = new Date(date2).getTime();

    const parser = bankParsers[bankTemp];
    if (!parser) return;

    transactions.forEach((transaction) => {
      const result = parser(transaction);
      if (!result) return;
      const timestamp = new Date(result.dateForFilter).getTime() + 7 * 3600000;
      if (timestamp_start <= timestamp && timestamp <= timestamp_end) {
        expenseList.push(result);
        if (result.real_value > 0) {
          incomeList.push(result);
          income += result.real_value;
        } else {
          expense += result.real_value;
        }
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

  const handleImport = () => {
    if (currentFile?.length) {
      const file = currentFile[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const wb = read(event.target.result);
        const sheets = wb.SheetNames;
        if (sheets.length) {
          const rows = utils.sheet_to_json(wb.Sheets[sheets[0]], { header: 1 });
          const skipRows = { VCB: 12, TCB: 8, ACB: 8, VTB: 25 };
          if (skipRows[bankTemp]) rows.splice(0, skipRows[bankTemp]);
          formatTransaction(rows);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleFileChange = (e) => setCurrentFile(e.target.files);
  const deleteRows = (rowsToDelete) =>
    setData(data.filter((_, index) => !rowsToDelete.includes(index)));
  const updateAdd = (newAdd) => setAdd(newAdd);
  const updateExpense = (newExp) => setExpense(newExp);

  return (
    <Container fluid>
      <Row>
        <Col md="3">
          <label>Chọn format xlsx từ ngân hàng:</label>
          <Form.Control
            as="select"
            value={bankTemp}
            onChange={(e) => setBankFormat(e.target.value)}
          >
            <option defaultValue=""></option>
            <option value="ACB">ACB</option>
            <option value="VTB">VietinBank</option>
            <option value="VCB">VietcomBank</option>
            <option value="TCB">TechcomBank</option>
          </Form.Control>
          <br />
        </Col>
        <Col className="pr-1" md="2">
          <label>Ngày đầu</label>
          <Form.Control
            type="date"
            onChange={(e) => setDate1(e.target.value)}
            value={date1}
          />
        </Col>
        <Col className="pr-1" md="2">
          <label>Ngày cuối</label>
          <Form.Control
            type="date"
            onChange={(e) => setDate2(e.target.value)}
            value={date2}
          />
        </Col>
        <Col className="pr-1" md="3">
          <label>Tìm theo nội dung</label>
          <Form.Control
            type="text"
            onChange={(e) => setSearchTxt(e.target.value.toLowerCase())}
            value={searchTxt}
          />
        </Col>
        <Col md="2">
          <label>Loại giao dịch</label>
          <Form.Control
            as="select"
            value={transacType}
            onChange={(e) => setTransacType(e.target.value)}
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
          <span style={{ color: "green", fontWeight: "bold" }}>
            {Number(add).toLocaleString("vi-VN")} VND
          </span>
        </Col>
        <Col className="pr-1" md="3">
          <div>Tổng số tiền chi ra:</div>
          <span style={{ color: "red", fontWeight: "bold" }}>
            {Number(expense).toLocaleString("vi-VN")} VND
          </span>
        </Col>
        <Col md="3">
          <button
            onClick={handleImport}
            className="btn btn-primary float-right"
          >
            Tải lại <i className="fa fa-refresh"></i>
          </button>
        </Col>
      </Row>
      <Row>
        <div className="row">
          <div className="col-sm-12">
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
  );
};

export default IncomeView;
