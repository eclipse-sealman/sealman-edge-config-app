import { render } from "@/utils/test-utils";
import LatitudeLongitudeInput from "../LatitudeLongitudeInput";
import { fireEvent } from "@testing-library/react";

describe("LatitudeLongitudeInput", () => {
  it("Should render the component", async () => {
    const { getByText } = render(<LatitudeLongitudeInput latitude="" longitude="" onChange={() => {}} />);
    expect(getByText("Latitude:")).toBeInTheDocument();
    expect(getByText("Longitude:")).toBeInTheDocument();
  });

  it("Should display error message if alphabetic value is entered in latitude or longitude", async () => {
    const { getByLabelText, getByText } = render(
      <LatitudeLongitudeInput latitude="" longitude="" onChange={() => {}} />
    );

    const latitudeInput = getByLabelText("Latitude:");
    fireEvent.change(latitudeInput, { target: { value: "text" } });

    expect(getByText("Latitude must not contain alphabetic characters")).toBeInTheDocument();

    const longitudeInput = getByLabelText("Longitude:");
    fireEvent.change(longitudeInput, { target: { value: "text" } });

    expect(getByText("Longitude must not contain alphabetic characters")).toBeInTheDocument();
  });

  it("Should display error message if non-valid value is entered in latitude or longitude", async () => {
    const { getByLabelText, getByText } = render(
      <LatitudeLongitudeInput latitude="" longitude="" onChange={() => {}} />
    );

    const latitudeInput = getByLabelText("Latitude:");
    fireEvent.change(latitudeInput, { target: { value: "200" } });

    expect(getByText("Latitude must be between -90 and 90")).toBeInTheDocument();

    const longitudeInput = getByLabelText("Longitude:");
    fireEvent.change(longitudeInput, { target: { value: "500" } });

    expect(getByText("Longitude must be between -180 and 180")).toBeInTheDocument();
  });

  it("Should call onChange when latitude value is changed", async () => {
    const mockOnChange = vi.fn();
    const { getByLabelText } = render(<LatitudeLongitudeInput latitude="" longitude="" onChange={mockOnChange} />);

    const latitudeInput = getByLabelText("Latitude:");
    fireEvent.change(latitudeInput, { target: { value: "45" } });

    expect(mockOnChange).toHaveBeenCalledWith("45", "", { latitude: "", longitude: "" });
  });

  it("Should populate latitude and longitude when value is pasted in latitude input", async () => {
    const mockOnChange = vi.fn();
    const { getByLabelText } = render(
      <LatitudeLongitudeInput latitude="" longitude="" onChange={mockOnChange} />
    );

    const latitudeInput = getByLabelText("Latitude:");
    fireEvent.paste(latitudeInput, { clipboardData: { getData: () => "52.67727587780675,-2.4223251900218528" } });

    expect(mockOnChange).toHaveBeenCalledWith("52.67727587780675", "-2.4223251900218528", { latitude: "", longitude: "" });
  });
});
