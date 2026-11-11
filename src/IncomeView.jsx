import { useState } from "react";
import { read, utils } from "xlsx";
import { Form, Container, Row, Col } from "react-bootstrap";
import FilteredList from "./FilteredList";

const IncomeView = () => {
  const [data, setData] = useState([]);
  const [date1, setDate1] = useState("");
  const [date2, setDate2] = useState("");
  const [searchTxt, setSearchTxt] = useState("");
  const [ignoreTxt, setIgnoreTxt] = useState("");
  const [add, setAdd] = useState(0);
  const [expense, setExpense] = useState(0);
  const [bankTemp, setBankFormat] = useState("");
  const [transacType, setTransacType] = useState("");
  const [currentFile, setCurrentFile] = useState(null);
  const [numericTotal, setNumericTotal] = useState(0);

  const formatValue = (num) => Number(num).toLocaleString("en-US");

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
        dateForFilter,
        value: formatValue(real),
        date: rawDate,
        content: transaction[6],
        real_value: real,
        numeric_value: real,
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
        dateForFilter,
        value: formatValue(real),
        date: datePart.replaceAll("-", "/"),
        content: transaction[1],
        real_value: real,
        numeric_value: real,
      };
    },
    ACB: (transaction) => {
      const datePart = transaction[1].split(" ")[0];
      const parts = datePart.split("/");
      const dateForFilter = `${parts[1]}/${parts[0]}/${parts[2]}`;
      let value = transaction[5] + "";
      let real = parseFloat(value.replaceAll(".", ""));
      if (value === "") {
        value = transaction[4] + "";
        real = -1 * parseFloat(value.replaceAll(".", ""));
      }
      return {
        id: transaction[0].index,
        dateForFilter,
        value: formatValue(real),
        date: `${parts[0]}/${parts[1]}/${parts[2]}`,
        content: transaction[3],
        real_value: real,
        numeric_value: real,
      };
    },
    VTB: (transaction) => {
      if (transaction.length == 1) return null;
      const datePart = transaction[1].split(" ")[0];
      const parts = datePart.split("/");
      const dateForFilter = `${parts[1]}/${parts[0]}/${parts[2]}`;
      let value = transaction[3] + "";
      let real = parseFloat(value.replaceAll(",", ""));
      if (value === "0") {
        value = transaction[3] + "";
        real = -1 * parseFloat(value.replaceAll(".", ""));
      }
      return {
        id: transaction[0].index,
        dateForFilter,
        value: formatValue(real),
        date: `${parts[0]}/${parts[1]}/${parts[2]}`,
        content: transaction[2],
        real_value: real,
        numeric_value: real,
        name: transaction[8] !== undefined ? transaction[8] : "",
      };
    },
  };

  const formatTransaction = (transactions) => {
    let expenseList = [];
    let income = 0;
    let expense = 0;

    const timestamp_start = new Date(date1).getTime();
    if (date2 === "") setDate2(date1);
    const timestamp_end = new Date(date2 || date1).getTime();

    const parser = bankParsers[bankTemp];
    if (!parser) return;

    transactions.forEach((transaction, rowIndex) => {
      const result = parser(transaction);
      if (!result) return;

      const timestamp = new Date(result.dateForFilter).getTime() + 7 * 3600000;
      if (timestamp_start <= timestamp && timestamp <= timestamp_end) {
        // Keep a stable row key and separate the optional override from the default.
        result.rowId = `${bankTemp}-${rowIndex}`;
        result.category = "";
        result.numeric_value_default = result.numeric_value;
        result.numeric_value_override = "";
        expenseList.push(result);

        if (result.real_value > 0) {
          income += result.real_value;
        } else {
          expense += result.real_value;
        }
      }
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
          const skipRows = { VCB: 12, TCB: 8, ACB: 8, VTB: 6 };
          if (skipRows[bankTemp]) rows.splice(0, skipRows[bankTemp]);
          formatTransaction(rows);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleFileChange = (e) => setCurrentFile(e.target.files);

  const updateTransaction = (rowId, field, value) => {
    setData((previousData) =>
      previousData.map((transaction) => {
        if (transaction.rowId !== rowId) return transaction;

        if (field === "numeric_value_override") {
          const trimmedValue = value.trim();
          const effectiveValue =
            trimmedValue === ""
              ? transaction.numeric_value_default
              : Number(trimmedValue);

          return {
            ...transaction,
            numeric_value_override: value,
            numeric_value: effectiveValue,
          };
        }

        return { ...transaction, [field]: value };
      }),
    );
  };

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
            <option value=""></option>
            <option value="ACB">ACB</option>
            <option value="VTB">VietinBank</option>
            <option value="VCB">VietcomBank</option>
            <option value="TCB">TechcomBank</option>
          </Form.Control>
        </Col>
        <Col className="pr-1" md="3">
          <label>Ngày đầu</label>
          <Form.Control
            type="date"
            onChange={(e) => setDate1(e.target.value)}
            value={date1}
          />
        </Col>
        <Col className="pr-1" md="3">
          <label>Ngày cuối</label>
          <Form.Control
            type="date"
            onChange={(e) => setDate2(e.target.value)}
            value={date2}
          />
        </Col>
        <Col md="2">
          <label>Loại giao dịch</label>
          <Form.Control
            as="select"
            value={transacType}
            onChange={(e) => setTransacType(e.target.value)}
          >
            <option value=""></option>
            <option value="Add">Tiền vào</option>
            <option value="Exp">Tiền ra</option>
          </Form.Control>
        </Col>
        <br />
        <Row>
          <Col className="pr-1" md="5">
            <br />
            <br />
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
            <label>Tìm theo từ khoá</label>
            <Form.Control
              type="text"
              onChange={(e) => setSearchTxt(e.target.value.toLowerCase())}
              value={searchTxt}
            />
          </Col>
          <Col className="pr-1" md="3">
            <label>Bỏ qua từ khoá</label>
            <Form.Control
              type="text"
              onChange={(e) => setIgnoreTxt(e.target.value.toLowerCase())}
              value={ignoreTxt}
            />
          </Col>
        </Row>
      </Row>
      <br />
      <Row>
        <Col className="pr-1" md="3" />
        <Col className="pr-1" md="2">
          <div>Tổng tiền gửi vào:</div>
          <span style={{ color: "green", fontWeight: "bold" }}>
            {Number(add).toLocaleString("vi-VN")} đ
          </span>
        </Col>
        <Col className="pr-1" md="2">
          <div>Tổng tiền rút ra:</div>
          <span style={{ color: "red", fontWeight: "bold" }}>
            {Number(expense).toLocaleString("vi-VN")} đ
          </span>
        </Col>
        <Col className="pr-1" md="2">
          <div>Tổng tiền giao dịch:</div>
          <span style={{ color: "blue", fontWeight: "bold" }}>
            {Number(numericTotal).toLocaleString("vi-VN")} đ
          </span>
        </Col>
        <Col className="pr-1" md="2">
          <button
            onClick={handleImport}
            className="btn btn-primary float-right mt-1"
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
                ignored={ignoreTxt}
                bankTemp={bankTemp}
                updateExpense={updateExpense}
                updateAdd={updateAdd}
                type={transacType}
                updateTransaction={updateTransaction}
                updateNumericTotal={setNumericTotal}
              />
            </table>
          </div>
        </div>
      </Row>
    </Container>
  );
};

export default IncomeView;
