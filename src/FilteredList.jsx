import * as XLSX from "xlsx";

function FilteredList(props) {
  let add = 0;
  let exp = 0;

  const typeFilteredData = props.data.filter((el) => {
    if (props.type === "") return true;
    if (props.type === "Add") return el.real_value >= 0;
    return el.real_value < 0;
  });

  const contentFilteredData = typeFilteredData.filter((el) => {
    const content = (el.content || "").toLowerCase();
    const inputKeyword = props.input.toLowerCase();
    const ignoredKeyword = props.ignored.toLowerCase();

    if (inputKeyword === "" && ignoredKeyword === "") return true;
    if (inputKeyword === "") return !content.includes(ignoredKeyword);
    if (ignoredKeyword === "") return content.includes(inputKeyword);
    return content.includes(inputKeyword) && !content.includes(ignoredKeyword);
  });

  let totalNumericValue = 0;

  contentFilteredData.forEach((transaction) => {
    if (transaction.real_value > 0) {
      add += transaction.real_value;

      // Only calculate Numeric Value for income transactions
      totalNumericValue += Number(transaction.numeric_value) || 0;
    } else {
      exp += transaction.real_value;
    }
  });

  props.updateNumericTotal(totalNumericValue);

  // Totals remain based on the original bank transaction amounts.
  props.updateExpense(exp);
  props.updateAdd(add);

  const exportData = () => {
    const now = new Date();
    const timestamp = now.toLocaleString("vi-VN");
    const exportRows = contentFilteredData.map((transaction) => ({
      ...transaction,
      // Export the effective numeric value (override if entered, otherwise default).
      numeric_value: transaction.numeric_value,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "GHTK");
    XLSX.writeFile(workbook, props.bankTemp + "_" + timestamp + ".xlsx");
  };

  return (
    <>
      <thead>
        <tr>
          <th scope="col">STT</th>
          <th scope="col">Ngày</th>
          <th scope="col">Số Tiền</th>
          <th scope="col">Thông Tin</th>
          <th scope="col">Type</th>
          <th scope="col">Numeric Value</th>
          <th scope="col">
            <button onClick={exportData} className="btn btn-info">
              <i className="fa fa-download" aria-hidden="true"></i>
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        {contentFilteredData.length ? (
          contentFilteredData.map((transaction, index) => (
            <tr key={transaction.rowId || index}>
              <th scope="row">{index + 1}</th>
              <td>{transaction.date}</td>
              <td className="text-end">
                {transaction.real_value < 0 ? (
                  <span className="text-right badge bg-danger text-white">
                    {transaction.value}
                  </span>
                ) : (
                  <span className="text-right badge bg-success text-white">
                    {transaction.value}
                  </span>
                )}
              </td>
              <td className="text-start">{transaction.content}</td>
              <td>
                <select
                  className="form-control form-control-sm"
                  value={transaction.category || ""}
                  disabled={transaction.real_value <= 0}
                  onChange={(e) =>
                    props.updateTransaction(
                      transaction.rowId,
                      "category",
                      e.target.value,
                    )
                  }
                >
                  <option value="">Select type</option>
                  <option value="Whole">Whole</option>
                  <option value="Partial">Partial</option>
                  <option value="Cash">Cash</option>
                </select>
              </td>
              <td>
                <input
                  type="number"
                  step="any"
                  className="form-control form-control-sm"
                  value={transaction.numeric_value_override ?? ""}
                  placeholder={`${transaction.numeric_value_default}`}
                  disabled={
                    transaction.category === "Whole" ||
                    transaction.real_value <= 0
                  }
                  onChange={(e) =>
                    props.updateTransaction(
                      transaction.rowId,
                      "numeric_value_override",
                      e.target.value,
                    )
                  }
                />
              </td>
              <td></td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="7" className="text-center">
              Chưa có dữ liệu.
            </td>
          </tr>
        )}
      </tbody>
    </>
  );
}

export default FilteredList;
