function FilteredList(props) {
  const typeFilteredData = props.data.filter((el) => {
    if (props.type === "") {
      return el;
    } else if (props.type === "Add") {
      return el.real_value >= 0;
    } else {
      return el.real_value < 0;
    }
  });

  const contentFilteredData = typeFilteredData.filter((el) => {
    if (props.input === "") {
      return el;
    } else {
      return el.content.toLowerCase().includes(props.input);
    }
  });

  var add = 0;
  var exp = 0;
  contentFilteredData.forEach((transaction, index) => {
    if (transaction.real_value > 0) add += transaction.real_value;
    else exp += transaction.real_value;
  });

  props.updateExpense(exp);
  props.updateAdd(add);

  return (
    <tbody>
      {contentFilteredData.length ? (
        contentFilteredData.map((transaction, index) => (
          <tr key={index}>
            <th scope="row">{index + 1}</th>
            <td>{transaction.date}</td>
            <td>{transaction.content}</td>

            <td>
              {transaction.real_value < 0 ? (
                <span className="badge bg-danger text-white">
                  - {transaction.value}
                </span>
              ) : (
                <span className="badge bg-info text-white">
                  {transaction.value}
                </span>
              )}
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="5" className="text-center">
            Chưa có dữ liệu.
          </td>
        </tr>
      )}
    </tbody>
  );
}

export default FilteredList;
